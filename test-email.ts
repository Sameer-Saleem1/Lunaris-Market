import { transporter } from "./app/lib/mail";

/**
 * Test email configuration
 * Run with: npx ts-node test-email.ts
 */
async function testEmail() {
  try {
    console.log("Testing email configuration...");
    console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log("EMAIL_HOST:", process.env.EMAIL_HOST);
    console.log("EMAIL_PORT:", process.env.EMAIL_PORT);

    // Verify transporter
    await transporter.verify();
    console.log("✅ SMTP connection verified successfully!");

    // Send test email
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || "E-Commerce App"}" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself for testing
      subject: "Test Email - E-Commerce App",
      html: `
        <h1>Email Configuration Test</h1>
        <p>If you're reading this, your email configuration is working correctly!</p>
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
      `,
    });

    console.log("✅ Test email sent successfully!");
    console.log("Message ID:", info.messageId);
    console.log(`Check your inbox at: ${process.env.EMAIL_USER}`);
  } catch (error) {
    console.error("❌ Email test failed:");
    if (error instanceof Error) {
      console.error("Error:", error.message);
      console.error("Stack:", error.stack);
    } else {
      console.error(error);
    }

    console.log("\n📋 Troubleshooting tips:");
    console.log("1. Verify EMAIL_USER and EMAIL_PASSWORD in .env file");
    console.log(
      "2. For Gmail, use an App Password (not your regular password)",
    );
    console.log("3. Enable 'Less secure app access' or use App Passwords");
    console.log(
      "4. Check if your email provider requires different SMTP settings",
    );
  }
}

testEmail();
