import sgMail from '@sendgrid/mail'
sgMail.setApiKey(process.env.SENDGRID_KEY!);

export const EMAIL_TEMPLATES = {
  newDemoBooked: "newDemoBooked",
  reminderDemoClass: "reminderDemoClass",
} as const

const templates = {
  newDemoBooked: (data: any) => ({
    subject: "Demo Class Successfully Booked",
    html: `<strong>Hey ${data.name}</strong>
  <br/>
  <strong>We hope you're excited about the upcoming demo of our fantastic services!</strong>
  <br/>
  <strong>Session Duration: ${data.sessionDuration}</strong>
`}),
  reminderDemoClass: (data: any) => ({
    subject: "Demo execution reminder for date and time",
    html: `<strong>Hey ${data.name}</strong>
    <br/>
    <strong>We hope you're excited about the upcoming demo of our fantastic services!</strong>
    <br/>
    <strong>Session Duration: ${data.sessionDuration}</strong>
    <p>If you need any assistance, kindly reach out to our support team (email/phone).</p>
    <p>    
    Thanks & Regards,
    (Company) Team
    </p>
    `,
  })
}

const emailConfig = {
  from: "flexxitedev@gmail.com",
  // replyTo: "noreply@flexxitedev@gmail.com",
}

const mail = async (email: string, templateId: string, data: any) => {
  let template = {};
  if (templateId === "newDemoBooked") {
    template = templates.newDemoBooked(data);
  }
  if (templateId === "reminderDemoClass") {
    template = templates.reminderDemoClass(data);
  }
  // @ts-ignore
  const msg: sgMail.MailDataRequired = {
    ...emailConfig,
    ...template,
    to: email,

  };
  await sgMail.send(msg)
    .catch((error) => {
      console.error(error)
    })
  return;
}


export const SendEmail = {
  mail
}