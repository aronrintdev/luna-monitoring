import { TimePeriods } from './MonitorTimePeriod'
import { MonitorLocation, MonitorLocations } from './MonitorLocations'
import { User } from 'firebase/auth'
import { proxy, useSnapshot } from 'valtio'
import { devtools } from 'valtio/utils'

interface UserState {
  user?: User
  isLoggedIn: boolean
}

interface UIState {
  editor: {
    monitorLocations: MonitorLocation[]
    frequencyScale: number
  }
  results: {
    tabIndex: number
    filter: {
      timePeriod: { label: string; value: string }
      status: string
      locations: string[]
    }
  }
}

const userState: UserState = { isLoggedIn: false }
const uiState: UIState = {
  editor: {
    monitorLocations: [...MonitorLocations],
    frequencyScale: 0,
  },
  results: {
    tabIndex: 0,
    filter: { timePeriod: TimePeriods[0], status: '', locations: [] },
  },
}
const store = {
  user: proxy(userState),
  ui: proxy(uiState),
}

export const Store = {
  ...store,
  watch: useSnapshot,
}

if (process.env.NODE_ENV === 'development') devtools(proxy(store), 'store')

export default Store
