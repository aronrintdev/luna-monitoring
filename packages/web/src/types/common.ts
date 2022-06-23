export type TextVariants = 'header' | 'title' | 'text-field' | 'paragraph' | 'emphasis' | 'details' | 'small';
export interface UserInfo {
  uid?: string
  email?: string
  displayName?: string
  photoURL?: string
  phoneNumber?: string | null
}
export interface NotificationFormErrors {
  name?: boolean
  channel?: {
    type?: boolean
    email?: boolean
    webhookUrl?: boolean
  }
}
export interface SettingFormValidation {
  new_notification: NotificationFormErrors
  edit_notification: NotificationFormErrors
}