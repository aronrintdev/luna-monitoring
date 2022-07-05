import {
  Box,
  Flex,
  Input,
  FlexProps,
  FormControl,
  Switch,
  FormLabel,
} from '@chakra-ui/react'
import { useFormContext } from 'react-hook-form'

import { Section, Text } from '../components'

const InputField = ({ children }: FlexProps) => (
  <Flex flexDirection={'column'} borderRadius='8' borderColor='gray.200' width='100%' maxW={96}>
    {children}
  </Flex>
)

export default function SettingsSecurity() {
  const { register } = useFormContext()

  return (
    <Box width='100%'>
      <Section pt={4} pb={20}>
        <Text variant='title' color='black'>Settings</Text>
        <Box mt={6}>
          <FormControl display='flex' alignItems='center'>
            <Switch id='single_sign_on' size="sm" mr={2} {...register(`settings.security.single_sign_on` as const)} />
            <FormLabel htmlFor='single_sign_on' m={0}>
              <Text variant='text-field' color='black'>Single Sign-On (SSO)</Text>
            </FormLabel>
          </FormControl>
        </Box>
        <Box mt={6}>
          <FormControl display='flex' alignItems='center'>
            <Switch id='all_users_2fa' size="sm" mr={2} {...register(`settings.security.enforce_2fa_for_all` as const)} />
            <FormLabel htmlFor='all_users_2fa' m={0}>
              <Text variant='text-field' color='black'>Enforce 2FA for All Users</Text>
            </FormLabel>
          </FormControl>
        </Box>
        <Box mt={6}>
          <FormControl display='flex' alignItems='center'>
            <Switch id='advanced_security' size="sm" mr={2} {...register(`settings.security.advanced_security` as const)} />
            <FormLabel htmlFor='advanced_security' m={0}>
              <Text variant='text-field' color='black'>Advanced Security Control</Text>
            </FormLabel>
          </FormControl>
        </Box>
        <Box mt={6}>
          <FormControl display='flex' alignItems='center'>
            <Switch id='activity-logs' size="sm" mr={2} {...register(`settings.security.activity_logs` as const)} />
            <FormLabel htmlFor='activity-logs' m={0}>
              <Text variant='text-field' color='black'>Activity Logs</Text>
            </FormLabel>
          </FormControl>
        </Box>
      </Section>
    </Box>
  )
}
