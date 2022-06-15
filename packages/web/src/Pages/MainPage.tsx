import { Monitor, MonitorStats } from '@httpmon/db'
import axios from 'axios'
import { useQuery } from 'react-query'
import { useEffect } from 'react'
import {
  Box,
  Button,
  Grid,
  Flex,
  Heading,
  Icon,
  Stat,
  StatGroup,
  Tooltip,
  Select,
} from '@chakra-ui/react'
import { useForm } from "react-hook-form";
import { useNavigate } from 'react-router-dom'
import { NewMonitorHero } from '../components/NewMonitorHero'
import { FiAlertCircle, FiCheckCircle, FiEdit, FiTrendingUp, FiTrendingDown } from 'react-icons/fi'
import Section from '../components/Section'
import Text from '../components/Text'
import PrimaryButton from '../components/PrimaryButton'

interface StatusProps {
  mon: Monitor
  stats?: MonitorStats
  horizontalMode?: boolean
}

interface IFormInputs {
  filter: string
  sortBy: string
}

const uptime24 = (m: MonitorStats) => {
  if (m.day?.numItems > 0) {
    return Math.round(((m.day.numItems - m.day.numErrors) / m.day.numItems) * 100 * 100) / 100
  } else {
    return 0
  }
}

function RunChart({ stats, horizontalMode }: { stats?: MonitorStats, horizontalMode?: boolean }) {
  const navigate = useNavigate()
  if (!stats || !stats.lastResults) {
    return <></>
  }

  const p50 = stats.day.p50
  const p95 = stats.day.p95

  return (
    <Flex gap='1' alignItems='baseline'>
      {stats.lastResults.map((r) => (
        <Tooltip label={'Time - ' + r.totalTime + 'ms'} key={r.id}>
          {horizontalMode ? (
            <Box
              key={r.id}
              h='1'
              w={r.totalTime > p50 ? (r.totalTime > p95 ? '6' : '5') : '4'}
              bgColor={r.err ? 'red.200' : 'green.200'}
              borderRadius='4'
              _hover={{
                h: '1.5',
              }}
              onClick={(e) => {
                e.stopPropagation()
                navigate('/console/apiruns/' + r.id)
              }}
            />
          ) : (
            <Box
              key={r.id}
              w='1'
              h={r.totalTime > p50 ? (r.totalTime > p95 ? '6' : '5') : '4'}
              bgColor={r.err ? 'red.200' : 'green.200'}
              borderRadius='4'
              _hover={{
                w: '1.5',
              }}
              onClick={(e) => {
                e.stopPropagation()
                navigate('/console/apiruns/' + r.id)
              }}
            />
          )}
        </Tooltip>
      ))}
    </Flex>
  )
}

function StatusUpOrDown({ stats }: { stats?: MonitorStats }) {
  let bErr: boolean = false
  let color: string
  let label: string

  if (!stats || !stats.lastResults || stats.lastResults.length < 1) {
    label = ''
    color = 'gray.500'
  } else {
    bErr = Boolean(stats.lastResults[0].err)
    color = bErr ? 'red.200' : 'green.200'
    label = bErr ? 'DOWN' : 'UP'
  }
  return (
    <Flex ml='4' alignItems='center' justifyContent='center' bg={color} borderRadius='16' px='3' py='2'>
      {bErr ?
        <Icon color='white' as={FiTrendingDown} />
        : 
        <Icon color='white' as={FiTrendingUp} />
      }
      <Box w={1}></Box>
      <Text variant='details' color='white'>{label}</Text>
    </Flex>
  )
}

function MonitorStatusCard({ mon, stats, horizontalMode }: StatusProps) {
  const navigate = useNavigate()

  return (
    <Flex
      flexDirection='column'
      gap='2'
      borderRadius='8'
      border='1px'
      borderColor='gray.200'
      borderStyle='solid'
      boxShadow='0px 4px 16px rgba(224, 224, 224, 0.1)'
      bgColor='white'
      p='6'
      pb='5'
      justifyContent='begin'
      
    >
      <Flex justify='space-between' alignItems='center'>
        <Flex alignItems='center' cursor='pointer' onClick={() => navigate(`/console/monitors/${mon.id}`)}>
          <Text variant='header' color='black'>{mon.name}</Text>
          <StatusUpOrDown stats={stats} />
        </Flex>
        <Button borderRadius='4' bg='lightgray.100' p='0' onClick={() => navigate(`/console/monitors/${mon.id}/edit`)}>
          <Icon color='gray.300' as={FiEdit} cursor='pointer' />
        </Button>
      </Flex>
      <Text variant='text-field' color='gray.300'>{mon.url}</Text>
      <Box my={2}>
        <RunChart stats={stats} horizontalMode={horizontalMode} />
      </Box>
      <StatGroup>
        <Stat>
          <Text variant='emphasis' color='black'>UPTIME</Text><br/>
          <Text variant='emphasis' color='gray.300'>{stats ? uptime24(stats) + '%' : ''}</Text>
        </Stat>

        <Stat>
          <Text variant='emphasis' color='black'>24Hr AVG</Text><br/>
          <Text variant='emphasis' color='gray.300'>{stats?.day.avg.toFixed(2)}</Text>
        </Stat>

        <Stat>
          <Text variant='emphasis' color='black'>24Hr MEDIAN</Text><br/>
          <Text variant='emphasis' color='gray.300'>{stats?.day.p50.toFixed(2)}</Text>
        </Stat>

        <Stat>
          <Text variant='emphasis' color='black'>24 Hr P95</Text><br/>
          <Text variant='emphasis' color='gray.300'>{stats?.day.p95.toFixed(2)}</Text>
        </Stat>
      </StatGroup>
    </Flex>
  )
}

export function MainPage() {
  const navigate = useNavigate()
  const { register, watch } = useForm<IFormInputs>();
  watch()

  useEffect(() => {
    document.title = 'Dashboard | ProAutoma'
  }, [])

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      console.log(value, name, type)
    })
    return () => subscription.unsubscribe()
  }, [watch])

  async function getMonitors() {
    let resp = await axios({
      method: 'GET',
      url: '/monitors',
    })

    if (resp.status == 200) {
      const results = resp.data as Monitor[]
      return results
    }
    throw Error('Failed to get odemand results')
  }

  const { isLoading, data: monitors } = useQuery<Monitor[], Error>(
    ['monitors-list'],
    () => getMonitors(),
    {}
  )

  async function getMonitorStats() {
    let resp = await axios({
      method: 'GET',
      url: '/monitors/stats',
    })

    if (resp.status == 200) {
      const results = resp.data as MonitorStats[]
      return results
    }
    throw Error('Failed to get odemand results')
  }

  const { data: stats } = useQuery<MonitorStats[], Error>(['monitors-stats'], () =>
    getMonitorStats()
  )

  const uptime24 = (m: MonitorStats) => {
    if (m.day?.numItems > 0) {
      return ((m.day.numItems - m.day.numErrors) / m.day.numItems) * 100
    } else {
      return 0
    }
  }

  if (monitors && monitors.length == 0) {
    return <NewMonitorHero />
  }

  return (
    <Flex direction='column'>
      <Section>
        <Flex alignItems='center' justify={'space-between'}>
          <Text variant='header' color='black'>All monitors</Text>
          <PrimaryButton
            label='New monitor'
            variant='emphasis'
            color={'white'}
            onClick={() => navigate('/console/monitors/newapi')}
          ></PrimaryButton>
        </Flex>
      </Section>
      <Section py={4} minHeight='500px'>
        <Flex mb='6' alignItems={'center'} justify='end'>
          <Text variant='paragraph' color='darkgray.100'>View</Text>
          <Select ml='2' borderRadius={8} width='140px' color='gray.300' borderColor='gray.200' {...register(`filter`)}>
            <option value='all'>All</option>
            <option value='up'>Up</option>
            <option value='down'>Down</option>
          </Select>
          <Select ml='2' borderRadius={8} width='140px' color='gray.300' borderColor='gray.200' {...register(`sortBy`)}>
            <option value='latest'>Latest</option>
            <option value='oldest'>Oldest</option>
          </Select>
        </Flex>
        <Grid gap='6' templateColumns={'1fr 1fr'}>
          {monitors?.map((mon, index) => (
            <MonitorStatusCard
              mon={mon}
              stats={stats?.find((s) => s.monitorId == mon.id)}
              horizontalMode={index % 2 === 0}
              key={mon.id}
            />
          ))}
        </Grid>
      </Section>
    </Flex>
  )
}

export default MainPage
