import got from 'got'
import { logger } from '../Context'

export async function sendVerificationEmail(
  to: string,
  token: string,
  accountId?: string,
  isUserInvite?: boolean
) {
  const verifyLink =
    process.env.WEB_APP_URL +
    `/console/${isUserInvite ? 'users' : 'emails'}/verify?token=${token}&email=${encodeURIComponent(
      to
    )}&accountId=${accountId}`
  try {
    if (
      !process.env.SENDGRID_API_KEY ||
      !process.env.SENDGRID_NOTIFICATION_EMAIL_TEMPLATE ||
      !process.env.SENDGRID_SENDER_EMAIL
    ) {
      throw new Error('Some of environment variables are missing.')
    }

    const resp = await got.post('https://api.sendgrid.com/v3/mail/send', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      },
      json: {
        from: {
          email: process.env.SENDGRID_SENDER_EMAIL,
        },
        personalizations: [
          {
            to: [
              {
                email: to,
              },
            ],
            dynamic_template_data: {
              verify_link: verifyLink,
            },
          },
        ],
        template_id: process.env.SENDGRID_VERIFY_EMAIL_TEMPLATE,
      },
    })
    return resp.statusCode == 202
  } catch ($error) {
    logger.error(`SEND VERIFICATION MAIL: ${$error.message}`)
    return $error
  }
}

export function sendNotificationEmail(email: string, message: string) {
  try {
    if (
      !process.env.SENDGRID_API_KEY ||
      !process.env.SENDGRID_NOTIFICATION_EMAIL_TEMPLATE ||
      !process.env.SENDGRID_SENDER_EMAIL
    ) {
      throw new Error('Some of environment variables are missing.')
    }

    got.post('https://api.sendgrid.com/v3/mail/send', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      },
      json: {
        from: {
          email: process.env.SENDGRID_SENDER_EMAIL,
        },
        personalizations: [
          {
            to: [
              {
                email,
              },
            ],
            dynamic_template_data: {
              message,
            },
          },
        ],
        template_id: process.env.SENDGRID_NOTIFICATION_EMAIL_TEMPLATE,
      },
    })
  } catch ($error) {
    logger.error(`SEND NOTIFICATION MAIL: ${$error.message}`)
    return $error
  }
}

export function sendContactEmail(
  email: string,
  firstName: string,
  lastName: string,
  message: string
) {
  try {
    if (
      !process.env.SENDGRID_API_KEY ||
      !process.env.SENDGRID_CONTACT_EMAIL_TEMPLATE ||
      !process.env.SENDGRID_SENDER_EMAIL
    ) {
      throw new Error('Some of environment variables are missing.')
    }

    got.post('https://api.sendgrid.com/v3/mail/send', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      },
      json: {
        from: {
          email: process.env.SENDGRID_SENDER_EMAIL,
        },
        personalizations: [
          {
            to: [
              {
                email: 'support@proautoma.com',
              },
            ],
            dynamic_template_data: {
              message,
              firstName,
              lastName,
              email,
              subject: `Contact from ${firstName} ${lastName}`,
            },
          },
        ],
        template_id: process.env.SENDGRID_CONTACT_EMAIL_TEMPLATE,
      },
    })
  } catch ($error) {
    logger.error(`SEND NOTIFICATION MAIL: ${$error.message}`)
    return $error
  }
}
