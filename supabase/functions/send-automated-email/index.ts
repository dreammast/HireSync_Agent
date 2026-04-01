// Supabase Edge Function: send-automated-email
// 
// REQUIRED DEPLOYMENT:
// supabase functions deploy send-automated-email --no-verify-jwt
//
// REQUIRED SECRETS:
// supabase secrets set SENDGRID_API_KEY=SG.xxx
// supabase secrets set SENDGRID_FROM_EMAIL=dreammasterorigin@gmail.com
declare const Deno: any;

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, prefer',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
  // 1. CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const payload = await req.json().catch(() => ({}));
    const { type, to, candidateName, jobTitle, status, verificationLink, nextRound } = payload

    console.log('[Edge Function] Received payload:', { type, to, candidateName, jobTitle, status });

    // 2. Health Check (Matches App Ping and Curl/Fetch Tests)
    if (type === 'ping' || payload.name === 'Functions') {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "HireSync AI Transactional Node is ONLINE",
        timestamp: new Date().toISOString(),
        node: "Supabase Edge"
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 3. Secrets Validation
    const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')
    const FROM_EMAIL = Deno.env.get('SENDGRID_FROM_EMAIL')

    console.log('[Edge Function] API Key present:', !!SENDGRID_API_KEY);
    console.log('[Edge Function] From Email:', FROM_EMAIL);

    if (!SENDGRID_API_KEY || !FROM_EMAIL) {
      console.error('[Edge Function] Missing secrets');
      return new Response(JSON.stringify({ 
        error: "Config Error", 
        details: "SendGrid credentials missing in Deno environment. Run: supabase secrets set SENDGRID_API_KEY=SG.xxx",
        secretsFound: {
          apiKey: !!SENDGRID_API_KEY,          fromEmail: !!FROM_EMAIL
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!to) {
      console.error('[Edge Function] No recipient provided');
      return new Response(JSON.stringify({ error: "Recipient required" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let subject = ""
    let htmlContent = ""

    if (type === 'status_update') {
      const isApproved = status === 'APPROVED'
      subject = isApproved 
        ? `Congratulations! Next Steps for ${jobTitle} Position`
        : `Update on Your Application for ${jobTitle}`
      
      if (isApproved) {
        // APPROVED - Professional acceptance with next round details
        htmlContent = `
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; background: #f8fafc;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 50px 40px; border-radius: 20px 20px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 36px; font-weight: 800; letter-spacing: -0.5px;">HireSync AI</h1>
              <div style="margin-top: 20px; padding: 16px; background: rgba(255,255,255,0.2); border-radius: 12px; display: inline-block;">
                <p style="color: white; margin: 0; font-size: 18px; font-weight: 700;">🎉 Congratulations!</p>
              </div>
            </div>
            
            <div style="background: white; padding: 50px 40px; border-radius: 0 0 20px 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
              <h2 style="color: #1e293b; margin: 0 0 24px 0; font-size: 28px; font-weight: 700; line-height: 1.3;">Dear ${candidateName},</h2>
              
              <p style="color: #475569; font-size: 17px; line-height: 1.7; margin: 0 0 20px 0;">
                We are delighted to inform you that your application for the <strong style="color: #2563eb;">${jobTitle}</strong> position has been reviewed, and we are impressed with your qualifications and experience.
              </p>
              
              <p style="color: #475569; font-size: 17px; line-height: 1.7; margin: 0 0 30px 0;">
                We would like to invite you to proceed to the next stage of our selection process. This is an exciting opportunity to learn more about the role and for us to get to know you better.
              </p>

              ${nextRound ? `
                <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 2px solid #3b82f6; padding: 30px; border-radius: 16px; margin: 30px 0;">
                  <h3 style="color: #1e40af; margin: 0 0 20px 0; font-size: 22px; font-weight: 700;">📅 Next Round Details</h3>
                  
                  <div style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 16px;">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-weight: 600; width: 120px;">Round Type:</td>
                        <td style="padding: 8px 0; color: #1e293b; font-weight: 700;">${nextRound.type}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Date:</td>
                        <td style="padding: 8px 0; color: #1e293b; font-weight: 700;">${nextRound.date}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Time:</td>
                        <td style="padding: 8px 0; color: #1e293b; font-weight: 700;">${nextRound.time}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Mode:</td>
                        <td style="padding: 8px 0; color: #1e293b; font-weight: 700;">${nextRound.mode}</td>
                      </tr>
                      ${nextRound.venue ? `
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Venue:</td>
                        <td style="padding: 8px 0; color: #1e293b; font-weight: 700;">${nextRound.venue}</td>
                      </tr>
                      ` : ''}
                    </table>
                  </div>

                  ${nextRound.link ? `
                    <div style="text-align: center; margin-top: 24px;">
                      <a href="${nextRound.link}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                        🎯 Join Interview / Meeting
                      </a>
                    </div>
                  ` : ''}

                  ${nextRound.instructions ? `
                    <div style="background: white; padding: 20px; border-radius: 12px; margin-top: 16px; border-left: 4px solid #3b82f6;">
                      <p style="color: #1e40af; font-weight: 700; margin: 0 0 8px 0; font-size: 14px;">📋 Additional Instructions:</p>
                      <p style="color: #475569; margin: 0; font-size: 15px; line-height: 1.6; white-space: pre-line;">${nextRound.instructions}</p>
                    </div>
                  ` : ''}
                </div>
              ` : `
                <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 24px; border-radius: 12px; margin: 30px 0;">
                  <p style="color: #065f46; margin: 0; font-weight: 700; font-size: 16px;">
                    ✅ Your application has been approved! We will contact you shortly with details about the next steps.
                  </p>
                </div>
              `}
              
              <p style="color: #475569; font-size: 16px; line-height: 1.7; margin: 30px 0 0 0;">
                We look forward to speaking with you and learning more about how you can contribute to our team.
              </p>
              
              <p style="color: #64748b; font-size: 15px; margin-top: 40px; padding-top: 30px; border-top: 1px solid #e2e8f0;">
                Best regards,<br/>
                <strong style="color: #1e293b; font-size: 16px;">The HireSync AI Recruitment Team</strong><br/>
                <span style="color: #94a3b8; font-size: 13px;">HireSync AI - Connecting Talent with Opportunity</span>
              </p>
            </div>
          </div>
        `
      } else {
        // REJECTED - Professional and encouraging rejection
        htmlContent = `
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; background: #f8fafc;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 50px 40px; border-radius: 20px 20px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 36px; font-weight: 800; letter-spacing: -0.5px;">HireSync AI</h1>
            </div>
            
            <div style="background: white; padding: 50px 40px; border-radius: 0 0 20px 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
              <h2 style="color: #1e293b; margin: 0 0 24px 0; font-size: 28px; font-weight: 700; line-height: 1.3;">Dear ${candidateName},</h2>
              
              <p style="color: #475569; font-size: 17px; line-height: 1.7; margin: 0 0 20px 0;">
                Thank you for your interest in the <strong style="color: #2563eb;">${jobTitle}</strong> position and for taking the time to share your qualifications with us.
              </p>
              
              <p style="color: #475569; font-size: 17px; line-height: 1.7; margin: 0 0 20px 0;">
                We appreciate the effort you put into your application. After careful consideration, we have decided to move forward with other candidates whose qualifications more closely align with the specific requirements of this role at this time.
              </p>

              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 24px; border-radius: 12px; margin: 30px 0;">
                <p style="color: #92400e; margin: 0; font-weight: 700; font-size: 16px; line-height: 1.6;">
                  💡 This decision is not a reflection of your capabilities or potential. We were impressed by many aspects of your application, and we encourage you to apply for future opportunities that may be a better fit.
                </p>
              </div>

              <p style="color: #475569; font-size: 17px; line-height: 1.7; margin: 30px 0 20px 0;">
                We recognize that finding the right opportunity is important, and we want to help you in your career journey. We encourage you to:
              </p>

              <ul style="color: #475569; font-size: 16px; line-height: 1.8; margin: 20px 0; padding-left: 24px;">
                <li style="margin-bottom: 12px;">Keep your profile updated in our system for future opportunities</li>
                <li style="margin-bottom: 12px;">Explore other positions that may align better with your skills</li>
                <li style="margin-bottom: 12px;">Continue building your professional network and skills</li>
              </ul>

              <p style="color: #475569; font-size: 17px; line-height: 1.7; margin: 30px 0 0 0;">
                We wish you the very best in your career search and hope to connect with you again in the future. Thank you for considering us as a potential employer.
              </p>
              
              <p style="color: #64748b; font-size: 15px; margin-top: 40px; padding-top: 30px; border-top: 1px solid #e2e8f0;">
                Best regards,<br/>
                <strong style="color: #1e293b; font-size: 16px;">The HireSync AI Recruitment Team</strong><br/>
                <span style="color: #94a3b8; font-size: 13px;">HireSync AI - Connecting Talent with Opportunity</span>
              </p>
            </div>
          </div>
        `
      }
    } else if (type === 'verification') {
      subject = "Verify Your HireSync ID"
      htmlContent = `
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px; font-family: system-ui, -apple-system, sans-serif; text-align: center;">
          <h1 style="color: #1e293b; font-size: 32px; font-weight: 800;">Verify Your Email</h1>
          <p style="color: #64748b; font-size: 16px; margin: 24px 0;">Click the button below to verify your HireSync account</p>
          <a href="${verificationLink}" style="display: inline-block; background: #2563eb; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; margin-top: 24px;">Verify Identity</a>
        </div>
      `
    } else {
      console.error('[Edge Function] Invalid email type:', type);
      return new Response(JSON.stringify({ error: "Invalid Type" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 4. SendGrid Dispatch
    console.log('[Edge Function] Calling SendGrid API...');
    const sgResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: FROM_EMAIL, name: 'HireSync AI' },
        subject: subject,
        content: [{ type: 'text/html', value: htmlContent }]
      })
    })

    if (!sgResponse.ok) {
      const err = await sgResponse.text()
      console.error('[Edge Function] SendGrid error:', sgResponse.status, err);
      return new Response(JSON.stringify({ 
        error: "Dispatch Fail", 
        details: err,
        statusCode: sgResponse.status      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('[Edge Function] Email sent successfully to:', to);
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Email Sent",
      recipient: to
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('[Edge Function] Unexpected error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})