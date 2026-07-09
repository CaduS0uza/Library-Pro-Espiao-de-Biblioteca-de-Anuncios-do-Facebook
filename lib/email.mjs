// Envio de e-mail via Resend (server-side). Template libpro com o código.
export const HTML = (code) => `
<div style="margin:0;padding:0;background:#070b14;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#070b14;padding:40px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <tr><td align="center">
      <table role="presentation" width="540" cellpadding="0" cellspacing="0" style="max-width:540px;width:100%;background:#0d1424;border:1px solid #1c2940;border-radius:20px;overflow:hidden;">
        <!-- topo com faixa -->
        <tr><td style="height:4px;background:#2563eb;"></td></tr>
        <tr><td style="padding:34px 40px 36px 40px;">
          <!-- logo -->
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="background:#fbbf24;width:34px;height:34px;border-radius:9px;text-align:center;font-size:18px;line-height:34px;">⚡</td>
            <td style="padding-left:10px;font-size:22px;font-weight:800;color:#f1f5fb;letter-spacing:-.3px;">LibPro</td>
          </tr></table>

          <h1 style="color:#ffffff;font-size:23px;font-weight:800;margin:26px 0 12px 0;">Código de verificação</h1>
          <p style="color:#94a3bd;font-size:14.5px;line-height:1.65;margin:0 0 26px 0;">
            Use o código abaixo para redefinir sua senha na <span style="color:#dbe5f5;font-weight:600;">LibPro</span>.
            Ele expira em <b style="color:#dbe5f5;">10 minutos</b>.
          </p>

          <!-- caixa do código -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a1120;border:1px solid #243352;border-radius:16px;">
            <tr><td align="center" style="padding:30px 20px;">
              <div style="color:#7e8db0;font-size:11.5px;letter-spacing:3px;text-transform:uppercase;margin-bottom:14px;">Seu código</div>
              <div style="color:#5b9bff;font-size:46px;font-weight:800;letter-spacing:12px;font-family:ui-monospace,'SF Mono',Menlo,monospace;padding-left:12px;">${code}</div>
            </td></tr>
          </table>

          <p style="color:#5f6e8c;font-size:12.5px;line-height:1.6;margin:26px 0 0 0;">
            🔒 Se você não solicitou este código, ignore este e-mail — sua conta segue segura.
          </p>
          <hr style="border:none;border-top:1px solid #18233a;margin:26px 0 18px 0;" />
          <p style="color:#465269;font-size:11.5px;margin:0;">© LibPro · Espionagem de anúncios · Todos os direitos reservados</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</div>`;

export async function sendCode(email, code) {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY não configurada.");
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || "LibPro <onboarding@resend.dev>",
      to: [email],
      subject: "Seu código de verificação — LibPro",
      html: HTML(code),
    }),
  });
  if (!r.ok) { const t = await r.text().catch(() => ""); throw new Error("Resend " + r.status + ": " + t.slice(0, 150)); }
  return true;
}
