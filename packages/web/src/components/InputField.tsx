import { Flex, FlexProps } from '@chakra-ui/react'

const InputField = ({ children }: FlexProps) => (
  <Flex flexDirection={'column'} borderRadius='8' borderColor='gray.200' width='100%' maxW={96}>
    {children}
  </Flex>
)

export default InputField
