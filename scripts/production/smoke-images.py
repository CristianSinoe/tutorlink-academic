#!/usr/bin/env python3
"""Smoke the LOCAL images with disposable TLS PostgreSQL; never uses Aiven/secrets."""
import json
import os
from pathlib import Path
import secrets
import subprocess
import tempfile
import time
import urllib.request
import urllib.error
from urllib.parse import urlsplit


def run(*args):
    result = subprocess.run(args, capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError('Falló un comando del smoke aislado; no se imprimen sus valores')
    return result.stdout.strip()


def request(url, origin=None, method='GET', extra_headers=None):
    try:
        headers={'Origin': origin} if origin else {}
        headers.update(extra_headers or {})
        with urllib.request.urlopen(urllib.request.Request(url, headers=headers, method=method), timeout=3) as response:
            return response.status, response.read().decode(), response.headers
    except urllib.error.HTTPError as error:
        return error.code, '', error.headers


def wait_health(url, timeout=100):
    deadline=time.monotonic()+timeout
    while time.monotonic()<deadline:
        try:
            if request(url)[0] == 200: return
        except (OSError, TimeoutError): pass
        time.sleep(1)
    raise RuntimeError('El contenedor no alcanzó health en el plazo esperado')


def main():
    backend_image=os.environ.get('SMOKE_BACKEND_IMAGE','tutorlink-production-backend:local')
    frontend_image=os.environ.get('SMOKE_FRONTEND_IMAGE','tutorlink-production-frontend:local')
    frontend_origin=os.environ.get('SMOKE_FRONTEND_ORIGIN','https://app.example.org')
    origin=urlsplit(frontend_origin)
    if origin.scheme!='https' or not origin.hostname or origin.path or origin.query or origin.fragment or origin.username or '*' in frontend_origin:
        raise ValueError('SMOKE_FRONTEND_ORIGIN debe ser un origen HTTPS exacto')
    suffix=secrets.token_hex(5)
    network=f'tutorlink-prod-smoke-{suffix}'
    containers=[]
    for image in (frontend_image,backend_image,'postgres:16-alpine'):
        run('docker','image','inspect',image)
    with tempfile.TemporaryDirectory(prefix='tutorlink-prod-smoke-') as directory:
        root=Path(directory); certs=root/'certs'; certs.mkdir(mode=0o755)
        run('openssl','req','-x509','-newkey','rsa:2048','-nodes','-keyout',str(certs/'server.key'),'-out',str(certs/'ca.pem'),'-subj','/CN=tl-prod-db','-addext','subjectAltName=DNS:tl-prod-db','-days','1')
        def env_file(name, values):
            path=root/name; path.write_text(''.join(f'{key}={value}\n' for key,value in values.items())); path.chmod(0o600); return str(path)
        password=secrets.token_hex(32)
        database_env=env_file('database.env',{'POSTGRES_DB':'tl_prod_smoke','POSTGRES_USER':'tl_prod_smoke','POSTGRES_PASSWORD':password})
        backend_env=env_file('backend.env',{
            'SPRING_PROFILES_ACTIVE':'prod','PORT':'10000','DB_HOST':'tl-prod-db','DB_PORT':'5432','DB_NAME':'tl_prod_smoke',
            'DB_USER':'tl_prod_smoke','DB_PASSWORD':password,'DB_SSL_ROOT_CERT':'/etc/secrets/aiven-ca.pem',
            'SECURITY_JWT_SECRET':secrets.token_hex(32),'RECAPTCHA_SITE_KEY':'synthetic-smoke-site','RECAPTCHA_SECRET_KEY':'synthetic-smoke-secret',
            'RESEND_API_KEY':'synthetic-not-a-real-api-key','FRONTEND_BASE_URL':frontend_origin,
            'TUTORLINK_CORS_ALLOWED_ORIGIN_PATTERNS':frontend_origin,'APP_SEED_ADMIN_ENABLED':'false','ADMIN_BOOTSTRAP_ENABLED':'false'})
        run('docker','network','create',network)
        def start(name,*args):
            containers.append(name)
            run('docker','run','-d','--name',name,*args)
            return name
        def port(name, internal):
            info=json.loads(run('docker','inspect',name))[0]
            return f"http://127.0.0.1:{info['NetworkSettings']['Ports'][str(internal)+'/tcp'][0]['HostPort']}"
        try:
            db=start(network+'-db','--network',network,'--network-alias','tl-prod-db','--tmpfs','/var/lib/postgresql/data','-v',f'{certs}:/certs','--env-file',database_env,'postgres:16-alpine','sh','-c','chown postgres:postgres /certs/server.key && chmod 600 /certs/server.key && exec docker-entrypoint.sh postgres -c ssl=on -c ssl_cert_file=/certs/ca.pem -c ssl_key_file=/certs/server.key')
            for _ in range(40):
                ready=subprocess.run(['docker','exec',db,'pg_isready','-U','tl_prod_smoke','-d','tl_prod_smoke'],capture_output=True)
                if ready.returncode==0: break
                time.sleep(1)
            else: raise RuntimeError('PostgreSQL TLS no inició')
            backend=start(network+'-backend','--network',network,'-p','127.0.0.1::10000','--env-file',backend_env,'-v',f'{certs / "ca.pem"}:/etc/secrets/aiven-ca.pem:ro',backend_image)
            backend_url=port(backend,10000); wait_health(backend_url+'/api/health')
            assert request(backend_url+'/api/health')[1]=='ok'
            assert request(backend_url+'/api/health',frontend_origin)[2].get('Access-Control-Allow-Origin')==frontend_origin
            assert request(backend_url+'/api/health','https://other.example.org')[0]==403
            status, _, headers=request(backend_url+'/api/teacher/tasks',frontend_origin,'OPTIONS',{'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization,content-type'})
            assert status==200 and headers.get('Access-Control-Allow-Origin')==frontend_origin
            assert 'POST' in headers.get('Access-Control-Allow-Methods','')
            assert 'authorization' in headers.get('Access-Control-Allow-Headers','').lower()
            assert 'content-type' in headers.get('Access-Control-Allow-Headers','').lower()
            def sql(query): return run('docker','exec',db,'psql','-U','tl_prod_smoke','-d','tl_prod_smoke','-Atc',query)
            assert sql('select count(*) from flyway_schema_history where success')=='30'
            assert sql('select count(*) from tl_users')=='0'
            assert int(sql("select count(*) from pg_stat_ssl s join pg_stat_activity a using(pid) where s.ssl and a.usename='tl_prod_smoke'"))>0
            assert run('docker','exec',backend,'id','-u')!='0'
            print('Backend prod: health, 30 migraciones, TLS, CORS exacto/preflight con Authorization, usuario no root y ausencia de cuentas demo: OK')
            frontend=start(network+'-frontend','-p','127.0.0.1::10001','-e','PORT=10001','-e','VITE_API_BASE_URL=https://api.example.org','-e','VITE_RECAPTCHA_SITE_KEY=synthetic-public-key',frontend_image)
            url=port(frontend,10001); wait_health(url+'/healthz')
            assert request(url+'/admin/users')[0]==200
            assert 'root' in request(url+'/admin/users')[1]
            status, body, headers=request(url+'/runtime-config.js')
            assert status==200 and 'https://api.example.org' in body and 'no-store' in headers.get('Cache-Control','')
            assert 'RESEND_API_KEY' not in body and password not in body
            assert request(url+'/assets/does-not-exist.js')[0]==404
            assert run('docker','exec',frontend,'id','-u')!='0'
            print('Frontend: PORT, SPA, runtime público sin secretos, no-cache, assets 404 y usuario no root: OK')
            print('No se contactó Aiven, Google ni Resend; no se validó entrega de correo real.')
        finally:
            for name in reversed(containers):
                subprocess.run(['docker','rm','-f',name],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
            subprocess.run(['docker','network','rm',network],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)


if __name__=='__main__':
    main()
