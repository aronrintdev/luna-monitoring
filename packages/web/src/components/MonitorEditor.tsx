import {
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  Flex,
  FormControl,
  Grid,
  Heading,
  Icon,
  Input,
  Select,
  Slider,
  SliderMark,
  SliderThumb,
  SliderTrack,
  Stack,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useToast,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuItem,
  MenuButton,
  MenuList,
} from '@chakra-ui/react'
import { Monitor, MonitorAssertion, MonitorTuples } from '@httpmon/db'
import React, { useEffect, useRef } from 'react'
import { FormProvider, useFieldArray, useForm, useFormContext, Controller } from 'react-hook-form'

import { FiChevronsRight, FiPlus, FiTrash2, FiSearch, FiChevronDown } from 'react-icons/fi'
import { useMutation, useQuery } from 'react-query'
import axios from 'axios'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { MonitorAuthEditor } from './MonitorAuthEditor'
import {
  getRegionsFromShowLocations,
  getShowLocationsFromRegions,
  MonitorLocation,
  syncShowLocationsWithStore,
} from '../services/MonitorLocations'
import { Store } from '../services/Store'
import { frequencyMSToScale, FrequencyScales, scaleToFrequencyMS } from '../services/FrequencyScale'
import { MonitorNotifications } from './MonitorNotifications'
import { MonitorBodyEditor } from './MonitorBodyEditor'
import Section from '../components/Section'
import PrimaryButton from '../components/PrimaryButton'
import Text from '../components/Text'
import MonitorTab from '../components/MonitorTab'
import InputForm from '../components/InputForm'
import SelectForm from '../components/SelectForm'

function SliderThumbWithTooltip() {
  const { control } = useFormContext()
  const [showTooltip, setShowTooltip] = React.useState(false)
  return (
    <Controller
      control={control}
      name='frequencyScale'
      render={({ field }) => {
        return (
          <Slider
            id='slider'
            defaultValue={0}
            min={0}
            max={FrequencyScales.length - 1}
            step={1}
            value={field.value}
            onChange={(v) => {
              field.onChange(v)
            }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            {FrequencyScales.map((scale) => {
              return (
                <SliderMark
                  key={scale.label}
                  value={scale.scaleIndex}
                  mt='1'
                  ml='-2.5'
                  fontSize='sm'
                >
                  {scale.label}
                </SliderMark>
              )
            })}

            <SliderTrack bg={'gray.400'}>{/* <SliderFilledTrack /> */}</SliderTrack>
            <SliderThumb bg={'blue.200'} />
          </Slider>
        )
      }}
    />
  )
}

interface TupleProps {
  name: string
}
function TupleEditor({ name }: TupleProps) {
  const { control, register } = useFormContext()
  const {
    fields: tuples,
    append,
    remove,
  } = useFieldArray({
    name: name,
    control,
  })

  const nameToLabel = (name: string) => {
    switch (name) {
      case 'headers':
        return 'Add Header'
      case 'queryParams':
        return 'Add Query Param'
      case 'env':
        return 'Add Env Variable'
      default:
        return ''
    }
  }

  return (
    <>
      <Box>
        {tuples.map((field, index) => (
          <Flex key={field.id} mb='3'>
            <InputForm type='text' {...register(`${name}.${index}.0` as const)} placeholder='Name' />
            <InputForm
              type='text'
              ml='2'
              {...register(`${name}.${index}.1` as const)}
              placeholder='Value'
            />

            <Button ml='2' borderRadius='4' bg='lightgray.100' color='' onClick={() => remove(index)}>
              <Icon color='gray.100' as={FiTrash2} cursor='pointer' />
            </Button>
          </Flex>
        ))}
      </Box>
      <Button px={0} variant='unstyled' onClick={() => append([['', '']])}>
        <Flex align='center'>
          <Icon bg='lightgray.100' p='4px' width={6} height={6} mr='2' borderRadius='4' color='darkblue.100' as={FiPlus} cursor='pointer' />
          <Text variant='text-field' color='darkblue.100'>{nameToLabel(name)}</Text>
        </Flex>
      </Button>
    </>
  )
}

/**
 * ref: https://github.com/tuannguyensn2001/se06-7.1/blob/e061216df0019a83d60bb16b42381af3e6d0a6c2/frontend_next/features/my_models_editor/components/Setting/Rotate/index.jsx#L3
 *
 */
function Locations() {
  const { control } = useFormContext()
  const { fields: showLocations } = useFieldArray({
    name: 'showLocations',
  })

  return (
    <Menu>
      <MenuButton
        as={Button}
        bg='transparent'
        width='440px'
        rightIcon={<FiChevronDown />}
        border='1px'
        borderStyle='solid'
        borderColor='gray.200'
        borderRadius={8}
        textAlign='left'
        _hover={{ bg: 'transparent' }}
        _active={{ bg: 'transparent' }}
      >
        Locations
      </MenuButton>
      <MenuList width='440px' boxShadow='0px 4px 16px rgba(0, 0, 0, 0.1)' borderRadius={8}>
        <CheckboxGroup>
          <Stack direction='column'>
            {showLocations.map((locEntry, index) => (
              <Controller
                key={locEntry.id}
                control={control}
                name={`showLocations.${index}.set`}
                render={({ field }) => {
                  return (
                    <MenuItem px={5} _focus={{ bg: 'lightgray.100' }} _active={{ bg: 'lightgray.100' }} closeOnSelect={false}>
                      <Checkbox colorScheme='cyan' borderRadius={4} width={'100%'} isChecked={field.value} onChange={field.onChange}>
                        <Text variant='text-field' color='darkgray.100'>{(locEntry as any)['name']}</Text>
                      </Checkbox>
                    </MenuItem>
                  )
                }}
              />
            ))}
          </Stack>
        </CheckboxGroup>
      </MenuList>
    </Menu>
  )
}

function Assertions() {
  const { control, register, watch } = useFormContext()
  const {
    fields: assertions,
    append,
    remove,
  } = useFieldArray({
    name: 'assertions',
    control,
  })

  const assertValues: MonitorAssertion[] = watch('assertions')

  function showNameField(assertion: MonitorAssertion) {
    return assertion.type == 'header' || assertion.type == 'jsonBody'
  }

  function isStringField(assertion: MonitorAssertion) {
    return assertion.type == 'header' || assertion.type == 'body' || assertion.type == 'jsonBody'
  }
  function placeholder(type: string) {
    switch (type) {
      case 'header':
        return 'Header Name'
      case 'jsonBody':
        return 'JSON Path'
    }
    return ''
  }

  return (
    <>
      <Grid gap='3'>
        {assertions.map((field, index) => (
          <Flex key={field.id} gap='2'>
            <SelectForm {...register(`assertions.${index}.type`)}>
              <option value='code'>Code</option>
              <option value='totalTime'>Total Time</option>
              <option value='certExpiryDays'>Days to Cert Expiry</option>
              <option value='header'>Header</option>
              <option value='body'>Body</option>
              <option value='jsonBody'>JSON Body</option>
            </SelectForm>

            {showNameField(assertValues[index]) && (
              <InputForm
                type='text'
                {...register(`assertions.${index}.name` as const)}
                placeholder={placeholder(assertValues[index].type)}
              />
            )}

            <SelectForm color='gray.100' borderRadius={8} defaultValue='=' {...register(`assertions.${index}.op`)}>
              {isStringField(assertValues[index]) && (
                <>
                  <option value='contains'>Contains</option>
                  <option value='matches'>Matches (regex)</option>
                </>
              )}
              <option value='='>Equal to</option>
              <option value='!='>Not equal to</option>
              <option value='>'>Greater than</option>
              <option value='<'>Less than</option>
            </SelectForm>
            <InputForm
              type='text'
              {...register(`assertions.${index}.value` as const)}
              placeholder='Value'
            />

            <Button borderRadius='4' bg='lightgray.100' color='' onClick={() => remove(index)}>
              <Icon color='gray.100' as={FiTrash2} cursor='pointer' />
            </Button>
          </Flex>
        ))}
      </Grid>
      <Button mt={3} px={0} variant='unstyled' onClick={() => append([{ type: '', value: '' }])}>
        <Flex align='center'>
          <Icon bg='lightgray.100' p='4px' width={6} height={6} mr='2' borderRadius='4' color='darkblue.100' as={FiPlus} cursor='pointer' />
          <Text variant='text-field' color='darkblue.100'>Add new</Text>
        </Flex>
      </Button>
    </>
  )
}

interface EditProps {
  handleOndemandMonitor: (mon: Monitor) => void
}

export function MonitorEditor({ handleOndemandMonitor }: EditProps) {
  //id tells apart Edit to a new check creation
  const { id } = useParams()

  let [searchParams, _] = useSearchParams()
  const queryUrl = searchParams.get('url')
  const queryMethod = searchParams.get('method')
  const runOnDemand = useRef<boolean>(Boolean(searchParams.get('run')))

  useEffect(() => {
    if (runOnDemand.current) {
      runOnDemand.current = false
      handleQuickRun()
    }
  }, [])

  interface FormMonitor extends Monitor {
    frequencyScale: number
    showLocations: MonitorLocation[]
  }

  const methods = useForm<FormMonitor>({
    defaultValues: {
      headers: [] as MonitorTuples,
      queryParams: [] as MonitorTuples,
      env: [] as MonitorTuples,
      assertions: [{ type: 'code', op: '=', value: '200' }] as MonitorAssertion[],
      frequencyScale: Store.UIState.editor.frequencyScale,
      showLocations: Store.UIState.editor.monitorLocations,
      auth: {},
      notifications: { failCount: 0 },
      bodyType: '',
      body: '',
      method: queryMethod || 'GET',
      url: queryUrl || '',
    },
  })

  const {
    register,
    reset,
    watch,
    handleSubmit,
    formState: { errors },
    getValues,
  } = methods

  const { isLoading, error: loadError } = useQuery<FormMonitor>(
    id || 'load',
    async () => {
      const resp = await axios({
        method: 'GET',
        url: `/monitors/${id}`,
      })
      //reset the form data directly
      const formMon: FormMonitor = {
        ...resp.data,
      }
      formMon.frequencyScale = frequencyMSToScale(formMon.frequency)
      formMon.showLocations = getShowLocationsFromRegions(resp.data.locations)

      reset(formMon)
      return formMon
    },
    {
      enabled: Boolean(id),
    }
  )

  const {
    mutateAsync: createMonitor,
    isLoading: isCreating,
    error: createError,
  } = useMutation<Monitor, Error, Monitor>(async (data: Monitor) => {
    const method = id ? 'POST' : 'PUT'
    const url = id ? `/monitors/${id}` : '/monitors'
    const resp = await axios({
      method,
      url,
      data: { ...data },
    })
    return resp.data as Monitor
  })

  const watched = watch()
  console.log(watched)

  function handleQuickRun() {
    handleOndemandMonitor(prepareMonitor(watched))
  }

  function numValues<T extends 'headers' | 'queryParams' | 'env'>(name: T) {
    const values = getValues(name)

    if (values && values.length > 0) {
      return values.filter((item) => Boolean(item[0])).length
    }
    return 0
  }

  function hasValidAuth() {
    if (watched.auth?.type === 'basic') {
      if (watched.auth?.basic?.username) return true
    }
    if (watched.auth?.type == 'bearer') {
      if (watched.auth?.bearer?.token) return true
    }
    return false
  }

  function hasValidBody() {
    return watched.bodyType != '' && Boolean(watched.body)
  }

  const toast = useToast()
  const navigate = useNavigate()

  function prepareMonitor(data: FormMonitor): Monitor {
    //cleanse data to become the monitor
    data.frequency = scaleToFrequencyMS(data.frequencyScale)
    data.locations = getRegionsFromShowLocations(data.showLocations)
    syncShowLocationsWithStore(data.showLocations)
    Store.UIState.editor.frequencyScale = data.frequencyScale

    let { frequencyScale, showLocations, ...monitor } = data //remove scale

    //remove empty fields from monitor
    if (monitor.headers && monitor.headers.length > 0) {
      monitor.headers = monitor.headers.filter((item) => item[0])
    }

    if (monitor.queryParams && monitor.queryParams.length > 0) {
      monitor.queryParams = monitor.queryParams.filter((item) => item[0])
    }

    if (monitor.env && monitor.env.length > 0) {
      monitor.env = monitor.env.filter((item) => item[0])
    }

    if (monitor.auth) {
      if (monitor.auth.type == 'none') {
        monitor.auth = {}
      } else if (monitor.auth.type == 'basic') {
        delete monitor.auth.bearer
      } else if (monitor.auth.type == 'bearer') {
        delete monitor.auth.basic
      }
    }
    return monitor
  }

  async function handleCreation(data: FormMonitor) {
    const monitor = prepareMonitor(data)
    const updating = Boolean(monitor.id)
    const monResp = await createMonitor(monitor)

    if (monResp.id) {
      toast({
        position: 'top',
        title: 'Monitor ' + updating ? 'updated.' : 'created',
        description: 'Your monitor is ready now!',
        status: 'success',
        duration: 2000,
        isClosable: true,
        onCloseComplete: () => {
          if (!updating) navigate('/console/monitors')
        },
      })
    }
  }

  return (
    <Box mx='2'>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(handleCreation)}>
          <Box>
            <Flex minH='100vh' justify='start' direction='column'>
              <Section>
                <Flex alignItems='center' justify={'space-between'}>
                  <Text variant='header' color='black'>Monitors</Text>
                  <PrimaryButton
                    label='Save Now'
                    variant='emphasis'
                    color={'white'}
                    onClick={() => console.log('clicked')}
                  ></PrimaryButton>
                </Flex>
              </Section>
              <Section paddingTop='29px' paddingBottom='10px' height='440px'>
                <Flex justify='space-between' alignItems='center'>
                  <Flex
                    alignItems='center'
                    padding={1}
                    borderRadius='3xl'
                    border='1px'
                    flex={1}
                    borderColor='gray.200'
                    borderStyle='solid'
                  >
                    <FormControl id='method' maxW='28'>
                      <Select
                        bg='gray.100'
                        color='white'
                        border='0'
                        borderRadius='3xl'
                        fontWeight='bold'
                        {...register('method')}
                      >
                        <option value='GET'>GET</option>
                        <option value='POST'>POST</option>
                        <option value='PUT'>PUT</option>
                        <option value='PATCH'>PATCH</option>
                        <option value='DELETE'>DELETE</option>
                        <option value='OPTIONS'>OPTIONS</option>
                      </Select>
                    </FormControl>

                    <FormControl id='url' ml='3'>
                      <InputGroup>
                        <InputLeftElement
                          pointerEvents='none'
                          fontSize='2xl'
                          height='1em'
                          color='gray.100'
                          children={<FiSearch />}
                        />
                        <Input
                          variant='unstyled'
                          fontWeight='bold'
                          color='gray.100'
                          placeholder='https://'
                          type='url'
                          {...register('url')}
                        />
                      </InputGroup>
                    </FormControl>
                  </Flex>

                  <PrimaryButton
                    label='Run now'
                    variant='emphasis'
                    color={'white'}
                    disabled={watched.url == ''}
                    onClick={handleQuickRun}
                    marginLeft={2}
                    padding={'14px 16px 15px'}
                  ></PrimaryButton>
                </Flex>

                <Tabs mt='4'>
                  <TabList borderBottomColor='lightgray.100'>
                    <MonitorTab>
                      Body
                      {hasValidBody() && <sup color='green'>1</sup>}
                    </MonitorTab> 
                    <MonitorTab>
                      Headers
                      {numValues('headers') > 0 && (
                        <sup color='green'>&nbsp;{numValues('headers')}</sup>
                      )}
                    </MonitorTab>
                    <MonitorTab>
                      Auth
                      {hasValidAuth() && <sup color='green'>1</sup>}
                    </MonitorTab>
                    <MonitorTab>
                      Query Params
                      {numValues('queryParams') > 0 && (
                        <sup color='green'>&nbsp;{numValues('queryParams')}</sup>
                      )}
                    </MonitorTab>
                    <MonitorTab>
                      Env Variables
                      {numValues('env') > 0 && <sup color='green'>&nbsp;{numValues('env')}</sup>}
                    </MonitorTab>
                  </TabList>

                  <TabPanels>
                    <TabPanel px='0' pt='6' pb='0'>
                      <MonitorBodyEditor />
                    </TabPanel>
                    <TabPanel px='0' pt='6' pb='0'>
                      <TupleEditor name='headers' />
                    </TabPanel>
                    <TabPanel px='0' pt='6' pb='0'>
                      <MonitorAuthEditor />
                    </TabPanel>
                    <TabPanel px='0' pt='6' pb='0'>
                      <TupleEditor name='queryParams' />
                    </TabPanel>
                    <TabPanel px='0' pt='6' pb='0'>
                      <TupleEditor name='env' />
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </Section>

              <Section py='4'>
                <Text variant='title' color='black'>Choose Test criteria</Text>
                <Box pt='6' pb='0'>
                  <Assertions />
                </Box>
              </Section>

              <Section py='4'>
                <Text variant='title' color='black'>How Often To Run?</Text>
                <Box pt='6' pb='0'>
                  <SliderThumbWithTooltip />
                </Box>
              </Section>

              <Section py='4'>
                <Text variant='title' color='black'>Choose Locations To Run From</Text>
                <Box pt='5' pb='2'>
                  <Locations />
                </Box>
              </Section>

              <Heading size='md' color='darkmagenta' mt='10' mb='4'>
                <Icon name='info' mr='2' as={FiChevronsRight} />
                Notifications
              </Heading>
              <MonitorNotifications />

              <Heading size='md' color='darkmagenta' mt='10' mb='4'>
                <Icon name='info' mr='2' as={FiChevronsRight} />
                Name and Save
              </Heading>

              <Flex mt='2'>
                <FormControl id='name' w='200'>
                  <Flex alignItems='baseline'>
                    <InputForm
                      type='name'
                      autoComplete='name'
                      {...register('name')}
                      placeholder='Please choose a name'
                    />
                  </Flex>
                </FormControl>

                <Button
                  ml='4'
                  colorScheme='blue'
                  size='md'
                  w='40'
                  variant='solid'
                  disabled={!watched.url || !watched.name}
                  type='submit'
                >
                  {id ? 'Update' : 'Create'}
                </Button>
              </Flex>
            </Flex>
          </Box>
        </form>
      </FormProvider>
    </Box>
  )
}
