export const STUDENT_URL = process.env.NODE_ENV === "production" ? process.env.STUDENT_URL! : "http://localhost:3003";
export const TUTOR_URL = process.env.NODE_ENV === "production" ? process.env.TUTOR_URL! : "http://localhost:3000";
export const ADMIN_URL = process.env.NODE_ENV === "production" ? process.env.ADMIN_URL! : "http://localhost:3002"

export const MINUTES_BEFORE_ZOOM_TRIGGER = 30

export const SCHEDULED_TASK_TYPE = {
  "CREATE_MEET": "create_meet",
  "END_MEET": "end_meet",
  "EXECUTE_NOTIFICATION": "execute_notification"
}

export const DEFAULT_TUTOR_PAYMENT = 250;