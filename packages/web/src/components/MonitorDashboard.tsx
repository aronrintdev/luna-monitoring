import { Monitor, MonitorTable } from '@httpmon/db'
import axios from 'axios'
import { useQuery } from 'react-query'

import { useState } from 'react'
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Box,
  Button,
  IconButton,
  Flex,
  Input,
  Spacer,
  Menu,
  MenuButton,
  MenuItemOption,
  MenuOptionGroup,
  MenuList,
} from '@chakra-ui/react'
import {
  TriangleDownIcon,
  TriangleUpIcon,
  ChevronRightIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
} from '@chakra-ui/icons'

import { useTable, useSortBy, usePagination, Column } from 'react-table'
import { useNavigate } from 'react-router-dom'

const columns: Column<MonitorTable>[] = [
  {
    Header: 'Name',
    accessor: 'name',
  },
  {
    Header: 'Method',
    accessor: 'method',
  },
  {
    Header: 'Url',
    accessor: 'url',
  },
  {
    Header: 'Frequency',
    accessor: 'frequency',
  },
]

export function MonitorDashboard() {
  const navigate = useNavigate()

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

  const { isLoading, data } = useQuery<Monitor[], Error>(
    'monitors-dashboard',
    () => getMonitors(),
    {}
  )

  type DashMon = Pick<MonitorTable, 'url' | 'method' | 'name' | 'frequency'>

  const tableInstance = useTable(
    {
      columns,
      data: data ?? [],
      autoResetSortBy: false,
      autoResetPage: false,
    },
    useSortBy,
    usePagination
  )

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    rows,
    page,
    nextPage,
    previousPage,
    canNextPage,
    canPreviousPage,
    pageOptions,
    gotoPage,
    pageCount,
    state,
    setSortBy,
    allColumns,
  } = tableInstance

  const { pageSize, pageIndex } = state

  const [selectedSortColumn, setSelectedSortColumn] = useState({
    id: '',
    desc: false,
  })

  function handleSort(e: any) {
    let temp = Object.assign({}, selectedSortColumn)
    temp['id'] = e
    setSelectedSortColumn(temp)
    setSortBy([temp])
  }

  const typeOfSort = (e: any) => {
    let tempColumn
    if (e == '0') {
      tempColumn = Object.assign({}, selectedSortColumn)
      tempColumn['desc'] = false
      setSelectedSortColumn(tempColumn)
      setSortBy([tempColumn])
    } else {
      tempColumn = Object.assign({}, selectedSortColumn)
      tempColumn['desc'] = true
      setSelectedSortColumn(tempColumn)
      setSortBy([tempColumn])
    }
  }

  return (
    <>
      <Box>
        <Menu>
          <MenuButton
            alignSelf="center"
            rightIcon={<ChevronDownIcon />}
            variant="outline"
            mx="1em"
            size="xs"
            as={Button}
            colorScheme="blue"
          >
            {selectedSortColumn['desc'] == true ? 'Descending' : 'Ascending'}
          </MenuButton>
          <MenuList color="gray.800" zIndex="3" minWidth="240px">
            <MenuOptionGroup
              type="radio"
              defaultValue={'0'}
              onChange={(e) => typeOfSort(e)}
            >
              <MenuItemOption key={0} value={'0'}>
                Ascending
              </MenuItemOption>
              <MenuItemOption key={1} value={'1'}>
                Descending
              </MenuItemOption>
            </MenuOptionGroup>
          </MenuList>
        </Menu>
        <Menu>
          <MenuButton
            alignSelf="center"
            rightIcon={<ChevronDownIcon />}
            variant="outline"
            mx="1em"
            size="xs"
            as={Button}
            colorScheme="blue"
          >
            Sort By
          </MenuButton>
          <MenuList color="gray.800" zIndex="3" minWidth="240px">
            <MenuOptionGroup type="radio" onChange={(e) => handleSort(e)}>
              {allColumns.map((column, idx) => (
                <MenuItemOption
                  icon={
                    column.isSorted ? (
                      column.isSortedDesc ? (
                        <TriangleDownIcon />
                      ) : (
                        <TriangleUpIcon />
                      )
                    ) : (
                      <></>
                    )
                  }
                  key={idx}
                  value={column.id}
                >
                  {column.Header}
                </MenuItemOption>
              ))}
            </MenuOptionGroup>
          </MenuList>
        </Menu>
        <Button
          size="xs"
          m="4px"
          colorScheme="red"
          variant="outline"
          onClick={() => setSortBy([])}
        >
          Reset Sorting
        </Button>
      </Box>
      <Box maxH="30em" overflowY="scroll">
        <Table {...getTableProps()} size="sm" variant="simple">
          <Thead
            p="0"
            position="sticky"
            zIndex="1"
            top="0px"
            style={{ overflow: 'scroll' }}
            bg="gray.100"
          >
            {headerGroups.map((headerGroup, indexKey) => (
              <Tr p="0" {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column, columnIndex) => (
                  <Th
                    borderColor="gray.200"
                    p="1em"
                    className="th1"
                    color={'gray.800'}
                    {...column.getHeaderProps(column.getSortByToggleProps())}
                  >
                    {/* This will render the Title of column */}
                    {column.render('Header')}
                    {column.isSorted ? (
                      column.isSortedDesc ? (
                        <TriangleDownIcon />
                      ) : (
                        <TriangleUpIcon />
                      )
                    ) : (
                      ''
                    )}
                  </Th>
                ))}
              </Tr>
            ))}
          </Thead>

          <Tbody className="body1" p="1em" {...getTableBodyProps()}>
            {page && page.length > 0 ? (
              page.map((row) => {
                prepareRow(row)
                return (
                  <Tr
                    className="tr1"
                    onClick={() => {
                      navigate('/console/monitor/' + row.original.id)
                    }}
                    {...row.getRowProps()}
                  >
                    {row.cells.map((cell) => {
                      return (
                        <Td
                          className="td1"
                          color={'gray.600'}
                          {...cell.getCellProps()}
                        >
                          {cell.render('Cell')}{' '}
                        </Td>
                      )
                    })}
                  </Tr>
                )
              })
            ) : (
              <Tr>
                <Td>
                  <Text textAlign="center" fontSize="1em" mx="auto">
                    No Data Found
                  </Text>
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>
      <Flex
        borderTop="5px solid"
        borderColor="gray.200"
        justifyContent="flex-end"
      >
        <Spacer />
        <Flex alignContent="center">
          <IconButton
            aria-label="goto"
            _focus={{ boxShadow: '' }}
            _hover={{ backgroundColor: '' }}
            _active={{ backgroundColor: '' }}
            color="gray.800"
            bg="white"
            fontSize="15px"
            icon={<ArrowLeftIcon />}
            disabled={!canPreviousPage}
            onClick={() => gotoPage(0)}
          />
          <IconButton
            aria-label="prev"
            _focus={{ boxShadow: '' }}
            _hover={{ backgroundColor: '' }}
            _active={{ backgroundColor: '' }}
            color="gray.800"
            bg="white"
            fontSize="30px"
            icon={<ChevronLeftIcon />}
            disabled={!canPreviousPage}
            onClick={() => previousPage()}
          />
          <Text m="0" alignSelf="center">
            {pageIndex + 1} - {pageOptions.length}{' '}
          </Text>
          <IconButton
            aria-label="next"
            _focus={{ boxShadow: '' }}
            _hover={{ backgroundColor: '' }}
            _active={{ backgroundColor: '' }}
            color="gray.800"
            bg="white"
            fontSize="30px"
            icon={<ChevronRightIcon />}
            disabled={!canNextPage}
            onClick={() => nextPage()}
          />
          <IconButton
            aria-label="gotoprev"
            _focus={{ boxShadow: '' }}
            _hover={{ backgroundColor: '' }}
            _active={{ backgroundColor: '' }}
            color="gray.800"
            bg="white"
            fontSize="15px"
            icon={<ArrowRightIcon />}
            disabled={!canNextPage}
            onClick={() => gotoPage(pageCount - 1)}
          />
          <Text
            m="0"
            alignSelf="center"
            borderRightColor=""
            defaultChecked={Boolean(pageIndex + 1)}
            borderColor="gray.300"
            fontWeight="bold"
            fontSize="sm"
            whiteSpace="nowrap"
          >
            Go to page
          </Text>
          <Input
            mx="5px"
            alignSelf="center"
            borderColor="gray.600"
            onChange={(e) => {
              let pageNumber = e.target.value ? Number(e.target.value) - 1 : 0
              gotoPage(pageNumber)
            }}
            w="10%"
            size="sm"
          />
        </Flex>
      </Flex>
    </>
  )
}

export default MonitorDashboard
