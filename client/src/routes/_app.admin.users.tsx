import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import {
  Banner,
  Button,
  Card,
  EmptyState,
  FormLayout,
  HStack,
  Selector,
  Stack,
  Table,
  Text,
  TextInput,
} from '@astryxdesign/core'
import { adminUsersApi } from '../lib/api'
import { authClient, getSession, isAdmin } from '../lib/auth'
import { adminUserKeys, clearProtectedQueries, queryClient } from '../lib/query'
import { ApiError } from '../lib/types'
import type { AdminUser } from '../lib/types'

export const Route = createFileRoute('/_app/admin/users')({
  beforeLoad: async () => {
    if (!isAdmin(await getSession())) throw redirect({ to: '/jobs' })
  },
  component: UsersPage,
})

const pageSize = 20
type PendingAction = { user: AdminUser; type: 'role' | 'ban' }
const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
})
const helper = createColumnHelper<typeof features, AdminUser>()

function UsersPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [searchField, setSearchField] = useState<'email' | 'name'>('email')
  const [page, setPage] = useState(0)
  const [pendingAction, setPendingAction] = useState<PendingAction>()
  const [actionError, setActionError] = useState('')
  const reconcileAuthorization = () => {
    clearProtectedQueries()
    void authClient.getSession().then(() => router.invalidate())
  }
  const query = useQuery({
    queryKey: adminUserKeys.list(search, searchField, page * pageSize),
    queryFn: () =>
      adminUsersApi.listUsers(search, searchField, page * pageSize),
    retry: false,
  })
  const mutation = useMutation({
    mutationFn: async (action: PendingAction) => {
      if (action.type === 'role')
        return adminUsersApi.setRole(
          action.user.id,
          action.user.role === 'admin' ? 'user' : 'admin',
        )
      return action.user.banned
        ? adminUsersApi.unbanUser(action.user.id)
        : adminUsersApi.banUser(action.user.id)
    },
    onSuccess: async () => {
      setPendingAction(undefined)
      setActionError('')
      await queryClient.invalidateQueries({ queryKey: adminUserKeys.all })
    },
    onError: (error) => {
      if (error instanceof ApiError && error.kind === 'forbidden')
        reconcileAuthorization()
      setActionError(
        error instanceof Error
          ? error.message
          : 'The user could not be updated.',
      )
    },
  })
  const table = useTable({
    features,
    data: query.data?.users ?? [],
    columns: helper.columns([
      helper.accessor('name', { header: 'Name' }),
      helper.accessor('email', { header: 'Email' }),
      helper.accessor('role', {
        header: 'Role',
        cell: (info) => info.getValue() ?? 'user',
      }),
      helper.accessor('banned', {
        header: 'Ban status',
        cell: (info) => (info.getValue() ? 'Banned' : 'Active'),
      }),
      helper.display({
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: (info) => {
          const user = info.row.original
          return (
            <HStack gap={2}>
              <Button
                size="sm"
                variant="secondary"
                label={user.role === 'admin' ? 'Demote' : 'Promote'}
                onClick={() => {
                  setActionError('')
                  setPendingAction({ user, type: 'role' })
                }}
              />
              <Button
                size="sm"
                variant="secondary"
                label={user.banned ? 'Unban' : 'Ban'}
                onClick={() => {
                  setActionError('')
                  setPendingAction({ user, type: 'ban' })
                }}
              />
            </HStack>
          )
        },
      }),
    ]),
  })
  const authorizationDenied =
    query.error instanceof ApiError && query.error.kind === 'forbidden'
  useEffect(() => {
    if (!authorizationDenied) return
    reconcileAuthorization()
  }, [authorizationDenied, router])
  const applySearch = () => {
    setPage(0)
    void query.refetch()
  }
  if (authorizationDenied)
    return (
      <EmptyState
        title="Administrator access denied"
        description="The server refused this request. Your session has been refreshed."
      />
    )
  if (query.isPending)
    return (
      <EmptyState
        title="Loading users"
        description="Retrieving the administrator user list…"
      />
    )
  if (query.isError)
    return (
      <EmptyState
        title="Users could not be loaded"
        description={query.error.message}
        actions={<Button label="Retry" onClick={() => void query.refetch()} />}
      />
    )
  const totalPages = Math.max(1, Math.ceil(query.data.total / pageSize))
  return (
    <Stack gap={5}>
      <div className="page-heading">
        <div>
        <div className="eyebrow">Administration</div>
        <h1>User manager</h1>
        <p>
          Manage user roles and access. Changes are authorized by the server.
        </p>
        </div>
      </div>
      <Card className="form-panel">
        <FormLayout direction="horizontal">
          <Selector
            label="Search field"
            options={['email', 'name']}
            value={searchField}
            onChange={(value) => setSearchField(value as 'email' | 'name')}
          />
          <TextInput
            label="Search users"
            value={search}
            onChange={setSearch}
            placeholder={`Search by ${searchField}`}
          />
          <Button label="Search" onClick={applySearch} />
        </FormLayout>
      </Card>
      {actionError && <Banner status="error" title={actionError} />}
      {query.data.users.length === 0 ? (
        <EmptyState
          title="No matching users"
          description="Try a different search."
        />
      ) : (
        <div className="data-panel">
          <Table>
            <thead>
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id}>
                  {group.headers.map((header) => (
                    <th key={header.id}>
                      {header.column.getCanSort() ? (
                        <button
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <table.FlexRender header={header} />
                          <span aria-hidden="true">
                            {header.column.getIsSorted() === 'asc'
                              ? ' ↑'
                              : header.column.getIsSorted() === 'desc'
                                ? ' ↓'
                                : ''}
                          </span>
                        </button>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getAllCells().map((cell) => (
                    <td
                      key={cell.id}
                      data-label={String(cell.column.columnDef.header)}
                    >
                      <table.FlexRender cell={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
      <HStack justify="between">
        <Text type="supporting">
          {query.data.total} users · Page {page + 1} of {totalPages}
        </Text>
        <HStack gap={2}>
          <Button
            label="Previous"
            variant="secondary"
            isDisabled={page === 0}
            onClick={() => setPage((current) => current - 1)}
          />
          <Button
            label="Next"
            variant="secondary"
            isDisabled={page + 1 >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          />
        </HStack>
      </HStack>
      {pendingAction && (
        <dialog open aria-labelledby="confirmation-title">
          <Card>
            <Stack gap={3}>
              <h2 id="confirmation-title">
                Confirm{' '}
                {pendingAction.type === 'role'
                  ? pendingAction.user.role === 'admin'
                    ? 'demotion'
                    : 'promotion'
                  : pendingAction.user.banned
                    ? 'unban'
                    : 'ban'}
              </h2>
              <Text>Apply this change to {pendingAction.user.email}?</Text>
              <HStack justify="end" gap={2}>
                <Button
                  label="Cancel"
                  variant="secondary"
                  isDisabled={mutation.isPending}
                  onClick={() => setPendingAction(undefined)}
                />
                <Button
                  label="Confirm"
                  isLoading={mutation.isPending}
                  onClick={() => mutation.mutate(pendingAction)}
                />
              </HStack>
            </Stack>
          </Card>
        </dialog>
      )}
    </Stack>
  )
}
