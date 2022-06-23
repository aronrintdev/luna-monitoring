import {
  Avatar,
  Box,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  Flex,
  Icon,
  IconButton,
  Image,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Spacer,
  useColorModeValue,
  useDisclosure,
} from '@chakra-ui/react'
import { FaRegBell } from 'react-icons/fa'
import { FiSettings, FiLayers, FiMenu,  FiPackage, FiGrid } from 'react-icons/fi'
import { logoTitle } from './Assets'
import { Outlet, useNavigate } from 'react-router-dom'
import { signOut, useAuth } from './services/FirebaseAuth'
import { Text, NavItem } from './components'

const SIDEBAR_WIDTH = '240px'

export default function Console() {
  const sidebar = useDisclosure()
  const navigate = useNavigate()

  const { userInfo: user } = useAuth()


  const SidebarContent = (props: any) => (
    <Box
      as='nav'
      pos='fixed'
      top='0'
      left='0'
      zIndex='sticky'
      h='full'
      px='4'
      py='14'
      overflowX='hidden'
      overflowY='auto'
      bg={useColorModeValue('white', 'gray.800')}
      borderColor={useColorModeValue('inherit', 'gray.700')}
      borderRightWidth='1px'
      w={SIDEBAR_WIDTH}
      {...props}
    >
      <Flex direction='column' as='nav' py={4} fontSize='sm' color='gray.600' aria-label='Main Navigation'>
        <NavItem icon={FiLayers} to='/console/monitors'>
          <Text variant='text-field' color='inherit'>Monitors</Text>
        </NavItem>

        <NavItem icon={FiPackage} to='/console/environments'>
          <Text variant='text-field' color='inherit'>Environments</Text>
        </NavItem>
        <NavItem icon={FiGrid} to='/console/dashboards'>
          <Text variant='text-field' color='inherit'>Dashboards</Text>
        </NavItem>
        <NavItem icon={FiSettings} to='/console/settings'>
          <Text variant='text-field' color='inherit'>Settings</Text>
        </NavItem>
      </Flex>
    </Box>
  )
  
  return (
    <Box as='section' bg={useColorModeValue('lightgray.100', 'gray.700')} minH='100vh'>
      {/* Header */}
      <Flex
        as='header'
        align='center'
        justify='space-between'
        w='full'
        px='6'
        py='3'
        position='fixed'
        top='0'
        zIndex={1300}
        bg={'white'}
        boxShadow='0px 4px 16px #F5F5F5'
        h='14'
      >
        <IconButton
          aria-label='Menu'
          display={{ base: 'inline-flex', md: 'none' }}
          onClick={sidebar.onOpen}
          icon={<FiMenu />}
          size='sm'
        />

        <Image src={logoTitle} h='8' display={{ base: 'none', md: 'block' }} />

        <Spacer />
        <Flex align='center'>
          <Icon color='darkgray.100' fontSize={'lg'} as={FaRegBell} cursor='pointer' />

          <Menu>
            <MenuButton>
              <Flex>
                <Avatar
                  ml='4'
                  size='sm'
                  name={user?.displayName || user?.email || ''}
                  src={user?.photoURL ?? undefined}
                  cursor='pointer'
                />
                <Flex ml={2} alignItems={'start'} justify='center' flexDir={'column'}>
                  <Text variant='details' color='darkgray.100'>{user.displayName}</Text>
                  <Text variant='small' color='gray.300'>{user.email}</Text>
                </Flex>
              </Flex>
            </MenuButton>
            <MenuList>
              {user && user.displayName && <MenuItem color='purple'>{user.displayName}</MenuItem>}
              {user && user.email && <MenuItem>{user.email}</MenuItem>}
              <MenuDivider />
              <MenuItem
                onClick={async () => {
                  await signOut()
                  navigate('/')
                }}
              >
                Signout
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>
      <Flex>
        <SidebarContent display={{ base: 'none', md: 'unset' }} />
        <Drawer isOpen={sidebar.isOpen} onClose={sidebar.onClose} placement='left'>
          <DrawerOverlay />
          <DrawerContent>
            <SidebarContent w='full' borderRight='none' />
          </DrawerContent>
        </Drawer>
        <Box ml={{ base: 0, md: SIDEBAR_WIDTH }} pt='14' width={{ base: '100%', md: `calc(100% - ${SIDEBAR_WIDTH})` }} transition='.3s ease'>
          <Box as='main' p='2'>
            {/* Add content here, remove div below  */}
            <Outlet />
          </Box>
        </Box>
      </Flex>
    </Box>
  )
}
