// Deliberately ephemeral: no URL/history state, storage, telemetry or logs.
let pending = '';
export const readInvitation = () => pending;
export const rememberInvitation = token => { pending = token; };
export const forgetInvitation = () => { pending = ''; };
