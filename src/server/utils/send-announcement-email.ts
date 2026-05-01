import fs from "fs";
import path from "path";

/**
 * Sends a single announcement email via Brevo REST API.
 * Returns true on success, false on failure.
 */
export async function sendAnnouncementEmail(
    toEmail: string,
    announcement: { title: string; content: string; priority: string; category: string; author: string }
): Promise<boolean> {
    try {
        const senderEmail = process.env.BREVO_SENDER_EMAIL || "noreply@hclins.com";
        const senderName = "HCL Institute";

        let logoBase64 = "";
        try {
            const logoPath = path.join(process.cwd(), "public", "logo.png");
            if (fs.existsSync(logoPath)) {
                logoBase64 = fs.readFileSync(logoPath, "base64");
            }
        } catch { /* ignore logo load failure */ }

        const priorityColors: Record<string, string> = {
            high: "#dc2626",
            medium: "#d97706",
            low: "#16a34a",
        };
        const priorityColor = priorityColors[announcement.priority] || "#d97706";

        const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; max-width: 600px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="background-color: #000000; padding: 25px 0 20px 0; border-bottom: 4px solid #e6873c;">
                            <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                                <tr>
                                    ${logoBase64 ? '<td valign="middle" style="padding-right: 15px;"><img src="cid:logo.png" alt="Logo" style="width: 55px; height: 55px; border-radius: 50%; display: block;"></td>' : ""}
                                    <td valign="middle">
                                        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px;">HCL Institute</h1>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style="padding: 35px 30px;">
                            <div style="display: inline-block; background-color: ${priorityColor}; color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 12px; border-radius: 20px; letter-spacing: 0.5px; margin-bottom: 16px;">
                                ${announcement.priority} Priority
                            </div>
                            ${announcement.category ? `<span style="display: inline-block; background-color: #e5e7eb; color: #374151; font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 20px; margin-left: 8px; margin-bottom: 16px;">${announcement.category}</span>` : ""}

                            <h2 style="color: #1f2937; margin: 16px 0 12px 0; font-size: 22px; line-height: 1.3;">
                                ${announcement.title}
                            </h2>

                            <div style="background-color: #f9fafb; border-left: 4px solid #225675; border-radius: 0 8px 8px 0; padding: 20px; margin: 20px 0;">
                                <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0; white-space: pre-line;">${announcement.content}</p>
                            </div>

                            <p style="color: #9ca3af; font-size: 13px; margin: 20px 0 0 0;">
                                — ${announcement.author || "Admin"}, HCL Institute
                            </p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td align="center" style="background-color: #f1f5f9; padding: 20px; border-top: 1px solid #e2e8f0;">
                            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                                &copy; ${new Date().getFullYear()} HCL Institute. All rights reserved.
                            </p>
                            <p style="color: #94a3b8; font-size: 12px; margin: 10px 0 0 0;">
                                You received this email because you are a registered student at HCL Institute.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

        if (!process.env.BREVO_API_KEY) {
            console.log(`[Announcement Email] No BREVO_API_KEY set. Skipping email to ${toEmail}`);
            return false;
        }

        const reqBody: any = {
            sender: { email: senderEmail, name: senderName },
            to: [{ email: toEmail }],
            subject: `${announcement.title} — HCL Institute`,
            htmlContent: htmlTemplate,
        };

        if (logoBase64) {
            reqBody.attachment = [{ content: logoBase64, name: "logo.png" }];
        }

        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "api-key": process.env.BREVO_API_KEY,
            },
            body: JSON.stringify(reqBody),
        });

        if (response.ok) {
            return true;
        } else {
            const errorData = await response.json();
            console.error(`[Announcement Email] Brevo failed for ${toEmail}:`, errorData);
            return false;
        }
    } catch (error) {
        console.error(`[Announcement Email] Error sending to ${toEmail}:`, error);
        return false;
    }
}

/**
 * Sends announcement emails in batches to avoid overwhelming Brevo.
 * Processes BATCH_SIZE emails at a time with a short delay between batches.
 */
export async function sendAnnouncementEmailBatch(
    emails: string[],
    announcement: { title: string; content: string; priority: string; category: string; author: string }
): Promise<{ sent: number; failed: number }> {
    const BATCH_SIZE = 10;          // emails per batch
    const DELAY_BETWEEN_MS = 1000;  // 1 second between batches (Brevo rate limit)

    let sent = 0;
    let failed = 0;

    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
        const batch = emails.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
            batch.map(email => sendAnnouncementEmail(email, announcement))
        );

        for (const result of results) {
            if (result.status === "fulfilled" && result.value) {
                sent++;
            } else {
                failed++;
            }
        }

        // Delay between batches to respect Brevo rate limits
        if (i + BATCH_SIZE < emails.length) {
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_MS));
        }
    }

    console.log(`[Announcement Email] Batch complete: ${sent} sent, ${failed} failed out of ${emails.length} total`);
    return { sent, failed };
}
