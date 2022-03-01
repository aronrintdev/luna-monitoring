import {
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  Icon,
  Input,
  Select,
  Slider,
  SliderFilledTrack,
  SliderMark,
  SliderThumb,
  SliderTrack,
  Tooltip,
} from '@chakra-ui/react'
import { Monitor, MonitorTuples } from '@httpmon/db'
import React from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

import { FiPlusCircle, FiDelete, FiTrash, FiTrash2 } from 'react-icons/fi'

function SliderThumbWithTooltip() {
  const [sliderValue, setSliderValue] = React.useState(1)
  const [showTooltip, setShowTooltip] = React.useState(false)
  return (
    <Slider
      id="slider"
      defaultValue={0}
      min={0}
      max={7}
      step={1}
      // colorScheme="teal"
      onChange={(v) => setSliderValue(v)}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <SliderMark value={0} mt="1" ml="-2.5" fontSize="sm">
        1m
      </SliderMark>
      <SliderMark value={1} mt="1" ml="-2.5" fontSize="sm">
        5m
      </SliderMark>
      <SliderMark value={2} mt="1" ml="-2.5" fontSize="sm">
        10m
      </SliderMark>
      <SliderMark value={3} mt="1" ml="-2.5" fontSize="sm">
        15m
      </SliderMark>
      <SliderMark value={4} mt="1" ml="-2.5" fontSize="sm">
        30m
      </SliderMark>
      <SliderMark value={5} mt="1" ml="-2.5" fontSize="sm">
        1h
      </SliderMark>
      <SliderMark value={6} mt="1" ml="-2.5" fontSize="sm">
        12h
      </SliderMark>
      <SliderMark value={7} mt="1" ml="-2.5" fontSize="sm">
        24h
      </SliderMark>

      <SliderTrack bg={'gray.400'}>{/* <SliderFilledTrack /> */}</SliderTrack>

      <SliderThumb bg={'blue.200'} />

      {/* <Tooltip
        hasArrow
        bg="teal.500"
        color="white"
        placement="top"
        isOpen={showTooltip}
        label={`${sliderValue}m`}
      >
        <SliderThumb />
      </Tooltip> */}
    </Slider>
  )
}

export function NewAPI() {
  const navigate = useNavigate()
  const {
    register,
    watch,
    formState: { errors },
    control,
  } = useForm<Monitor>({
    defaultValues: {
      headers: [['xxx', 'hello']] as MonitorTuples,
    },
  })
  const {
    fields: headers,
    append,
    remove,
  } = useFieldArray({
    name: 'headers',
    control,
  })

  const watched = watch()

  function handleQuickRun() {
    let url = watched.url
    let method = watched.method

    navigate('/console/api-result', { state: { monitor: { url, method } } })
  }

  return (
    <Box>
      <Heading size={'lg'} mb={'10'}>
        Create new API monitor
      </Heading>
      <Divider />
      <form>
        <Box>
          <Flex minH={'100vh'} justify={'start'} direction={'column'}>
            <FormControl id="name">
              <FormLabel htmlFor="name">Name</FormLabel>
              <Input type="name" placeholder="" />
            </FormControl>

            <Flex justify={'start'} alignItems={'end'} mt={'4'}>
              <FormControl id="method" maxW={'32'}>
                <FormLabel htmlFor="method">Method</FormLabel>
                <Select
                  color={'blue.500'}
                  fontWeight={'bold'}
                  {...register('method')}
                >
                  <option defaultValue={'GET'} value="GET">
                    GET
                  </option>
                  <option value="POST">POST</option>
                  <option value="OPTIONS">OPTIONS</option>
                </Select>
              </FormControl>

              <FormControl id="url" ml={'2'}>
                <FormLabel htmlFor="url">URL</FormLabel>
                <Input type="url" placeholder="url here" {...register('url')} />
              </FormControl>

              <Button
                bg={'blue.400'}
                color={'white'}
                _hover={{
                  bg: 'blue.500',
                }}
                ml={'4'}
                onClick={() => handleQuickRun()}
              >
                Run now
              </Button>
            </Flex>

            <Heading size={'sm'} mt={'4'}>
              Add headers
            </Heading>

            <Box mt={'4'}>
              {console.log(watched)}
              {headers.map((header, index) => (
                <Flex key={index} mb={'2'}>
                  <Input
                    type={'text'}
                    {...register(`headers.${index}.0` as const)}
                    defaultValue={''}
                  />
                  <Input
                    type={'text'}
                    ml={'4'}
                    {...register(`headers.${index}.1` as const)}
                    defaultValue={''}
                  />

                  <Button onClick={() => remove(index)}>
                    <Icon color="red.500" as={FiTrash2} cursor="pointer" />
                  </Button>
                </Flex>
              ))}
              <Button onClick={() => append([['', '']])}>
                <Icon color="blue.500" as={FiPlusCircle} cursor="pointer" />
              </Button>
            </Box>

            <FormControl id="frequency" mt={'10'} maxW={'80%'}>
              <FormLabel htmlFor="frequency">Frequency</FormLabel>
              <SliderThumbWithTooltip />
            </FormControl>

            <Button
              bg={'blue.400'}
              color={'white'}
              _hover={{
                bg: 'blue.500',
              }}
              mt={'10'}
              w={'40'}
            >
              Create API Monitor
            </Button>
          </Flex>
        </Box>
      </form>
    </Box>
  )
}
