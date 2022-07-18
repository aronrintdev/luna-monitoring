import { Flex } from '@chakra-ui/react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Section, Text, PrimaryButton } from '../components'

export function Environments() {
  const navigate = useNavigate()

  return (
    <>
      <Section>
        <Flex alignItems='center' justify={'space-between'}>
          <Text variant='header' color='black'>
            Environments
          </Text>
          <Flex gap={2}>
            <PrimaryButton
              label='Add environment'
              variant='emphasis'
              color={'white'}
              onClick={() => navigate('/console/envs/new')}
            ></PrimaryButton>
          </Flex>
        </Flex>
      </Section>
      <Flex flex={1} height='fit-content'>
        <Outlet />
      </Flex>
    </>
  )
}
