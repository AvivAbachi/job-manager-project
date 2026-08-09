import { useRef, useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  Banner,
  Button,
  Card,
  Dialog,
  DialogHeader,
  FormLayout,
  HStack,
  Layout,
  NumberInput,
  Stack,
  Tab,
  TabList,
  Text,
} from '@astryxdesign/core'
import { jobsApi } from '../lib/api'
import { jobKeys, queryClient } from '../lib/query'
import { ApiError } from '../lib/types'
import type { CreateJobInput } from '../lib/types'

type JobCreationDialogProps = {
  isAdmin: boolean
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

const payloadKey = (input: CreateJobInput) => JSON.stringify(input)
const randomInteger = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

export function JobCreationDialog({
  isAdmin,
  isOpen,
  onOpenChange,
}: JobCreationDialogProps) {
  const [tab, setTab] = useState('create')

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      purpose="form"
      width={720}
    >
      <Layout
        height="auto"
        header={
          <DialogHeader title="Create jobs" onOpenChange={onOpenChange} />
        }
        content={
          <Stack gap={5}>
            <TabList
              value={tab}
              onChange={setTab}
              hasDivider
              aria-label="Job creation options"
            >
              <Tab value="create" label="Create job" />
              {isAdmin && <Tab value="simulator" label="Simulator" />}
            </TabList>
            {tab === 'create' ? <CreateJobForm /> : isAdmin && <Simulator />}
          </Stack>
        }
      />
    </Dialog>
  )
}

function CreateJobForm() {
  const intent = useRef<{ payload: string; key: string } | null>(null)
  const [createdId, setCreatedId] = useState<string>()
  const [error, setError] = useState('')
  const mutation = useMutation({
    mutationFn: async (input: CreateJobInput) => {
      const serialized = payloadKey(input)
      if (!intent.current || intent.current.payload !== serialized)
        intent.current = { payload: serialized, key: crypto.randomUUID() }
      return jobsApi.create(input, intent.current.key)
    },
    onSuccess: (job) => {
      queryClient.setQueryData(jobKeys.detail(job.id), job)
      void queryClient.invalidateQueries({ queryKey: jobKeys.member() })
      intent.current = null
      setCreatedId(job.id)
    },
    onError: (caught) => {
      const apiError = caught as ApiError
      if (!apiError.uncertain || apiError.kind === 'conflict')
        intent.current = null
      setError(apiError.message)
    },
  })
  const form = useForm({
    defaultValues: { totalStages: '5', totalTime: '10000', failStage: '' },
    onSubmit: ({ value }) => {
      setError('')
      setCreatedId(undefined)
      mutation.mutate({
        totalStages: Number(value.totalStages),
        totalTime: Number(value.totalTime),
        failStage: value.failStage === '' ? null : Number(value.failStage),
      })
    },
  })
  const reset = () => {
    intent.current = null
    mutation.reset()
    setError('')
    setCreatedId(undefined)
    form.reset()
  }
  const positiveInteger =
    (label: string) =>
    ({ value }: { value: string }) =>
      Number.isInteger(Number(value)) && Number(value) > 0
        ? undefined
        : `${label} must be a positive integer.`

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      <FormLayout>
        <form.Field
          name="totalStages"
          validators={{ onChange: positiveInteger('Total stages') }}
        >
          {(field) => (
            <NumberInput
              label="Total stages"
              min={1}
              step={1}
              value={Number(field.state.value)}
              onChange={(value) => field.handleChange(String(value))}
              status={
                field.state.meta.errors[0]
                  ? {
                      type: 'error',
                      message: field.state.meta.errors[0].toString(),
                    }
                  : undefined
              }
            />
          )}
        </form.Field>
        <form.Field
          name="totalTime"
          validators={{ onChange: positiveInteger('Total time') }}
        >
          {(field) => (
            <NumberInput
              label="Total time (ms)"
              min={1}
              step={1}
              value={Number(field.state.value)}
              onChange={(value) => field.handleChange(String(value))}
              status={
                field.state.meta.errors[0]
                  ? {
                      type: 'error',
                      message: field.state.meta.errors[0].toString(),
                    }
                  : undefined
              }
            />
          )}
        </form.Field>
        <form.Field
          name="failStage"
          validators={{
            onChangeListenTo: ['totalStages'],
            onChange: ({ value, fieldApi }) =>
              value === '' ||
              (Number.isInteger(Number(value)) &&
                Number(value) >= 0 &&
                Number(value) <
                  Number(fieldApi.form.getFieldValue('totalStages')))
                ? undefined
                : 'Failure stage must be an integer from 0 to total stages − 1.',
          }}
        >
          {(field) => (
            <NumberInput
              label="Failure stage (optional)"
              min={0}
              step={1}
              hasClear
              value={
                field.state.value === '' ? null : Number(field.state.value)
              }
              onChange={(value) =>
                field.handleChange(value == null ? '' : String(value))
              }
              status={
                field.state.meta.errors[0]
                  ? {
                      type: 'error',
                      message: field.state.meta.errors[0].toString(),
                    }
                  : undefined
              }
            />
          )}
        </form.Field>
        {error && (
          <Banner
            status="error"
            title={error}
            description={
              mutation.error instanceof ApiError && mutation.error.uncertain
                ? 'Retrying unchanged values will safely reuse the same submission key.'
                : undefined
            }
          />
        )}
        {createdId && (
          <Banner
            status="success"
            title="Job created."
            description={
              <>
                <Link to="/jobs/$jobId" params={{ jobId: createdId }}>
                  View its details
                </Link>
                .
              </>
            }
          />
        )}
        <HStack justify="between">
          <form.Subscribe selector={(state) => [state.canSubmit]}>
            {([canSubmit]) => (
              <Button
                type="submit"
                isDisabled={!canSubmit || mutation.isPending}
                isLoading={mutation.isPending}
                label={
                  mutation.isPending
                    ? 'Submitting…'
                    : error && intent.current
                      ? 'Retry submission'
                      : 'Create job'
                }
              />
            )}
          </form.Subscribe>
          <Button
            label="Reset"
            variant="secondary"
            type="button"
            onClick={reset}
            isDisabled={mutation.isPending}
          />
        </HStack>
      </FormLayout>
    </form>
  )
}

function Simulator() {
  const [jobCount, setJobCount] = useState(20)
  const [maxStages, setMaxStages] = useState(10)
  const [maxSeconds, setMaxSeconds] = useState(30)
  const [failureRate, setFailureRate] = useState(20)
  const [running, setRunning] = useState(false)
  const [counts, setCounts] = useState({
    submitted: 0,
    succeeded: 0,
    failed: 0,
  })
  const [errors, setErrors] = useState<string[]>([])
  const valid =
    Number.isInteger(jobCount) &&
    jobCount >= 1 &&
    jobCount <= 20000 &&
    Number.isInteger(maxStages) &&
    maxStages >= 1 &&
    maxStages <= 20 &&
    Number.isInteger(maxSeconds) &&
    maxSeconds >= 1 &&
    maxSeconds <= 60 &&
    failureRate >= 0 &&
    failureRate <= 100

  async function start() {
    if (!valid || running) return
    setRunning(true)
    setCounts({ submitted: 0, succeeded: 0, failed: 0 })
    setErrors([])
    const jobs: CreateJobInput[] = Array.from({ length: jobCount }, () => {
      const totalStages = randomInteger(1, maxStages)
      return {
        totalStages,
        totalTime: randomInteger(1, maxSeconds) * 1000,
        failStage:
          Math.random() * 100 < failureRate
            ? randomInteger(0, totalStages - 1)
            : null,
      }
    })
    let next = 0
    const submit = async () => {
      while (next < jobs.length) {
        const index = next++
        setCounts((current) => ({
          ...current,
          submitted: current.submitted + 1,
        }))
        try {
          await jobsApi.create(jobs[index], crypto.randomUUID())
          setCounts((current) => ({
            ...current,
            succeeded: current.succeeded + 1,
          }))
        } catch (error) {
          setCounts((current) => ({ ...current, failed: current.failed + 1 }))
          setErrors((current) => [
            ...current,
            `Job ${index + 1}: ${error instanceof Error ? error.message : 'Request failed.'}`,
          ])
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(10, jobs.length) }, submit))
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: jobKeys.member() }),
      queryClient.invalidateQueries({ queryKey: jobKeys.admin() }),
    ])
    setRunning(false)
  }

  return (
    <Stack gap={5}>
      <Text type="supporting">
        Submit a finite randomized batch of jobs. At most 10 requests run at
        once.
      </Text>
      <Card>
        <FormLayout>
          <NumberInput
            label="Jobs"
            min={1}
            max={20000}
            step={1}
            value={jobCount}
            onChange={(value) => setJobCount(Number(value))}
          />
          <NumberInput
            label="Maximum stages"
            min={1}
            max={20}
            step={1}
            value={maxStages}
            onChange={(value) => setMaxStages(Number(value))}
          />
          <NumberInput
            label="Maximum duration (seconds)"
            min={1}
            max={60}
            step={1}
            value={maxSeconds}
            onChange={(value) => setMaxSeconds(Number(value))}
          />
          <NumberInput
            label="Failure rate (%)"
            min={0}
            max={100}
            step={1}
            value={failureRate}
            onChange={(value) => setFailureRate(Number(value))}
          />
          {!valid && (
            <Banner
              status="error"
              title="Use jobs 1–20000, stages 1–20, duration 1–60 seconds, and a failure rate from 0% to 100%."
            />
          )}
          <HStack justify="between">
            <Text type="supporting">
              Submitted {counts.submitted} · Succeeded {counts.succeeded} ·
              Failed {counts.failed}
            </Text>
            <Button
              label={running ? 'Submitting…' : 'Start simulation'}
              isLoading={running}
              isDisabled={!valid || running}
              onClick={() => void start()}
            />
          </HStack>
        </FormLayout>
      </Card>
      {!running && counts.submitted > 0 && (
        <Banner
          status={counts.failed ? 'error' : 'success'}
          title={`Simulation complete: ${counts.succeeded} succeeded, ${counts.failed} failed.`}
        />
      )}
      {errors.length > 0 && (
        <Card>
          <Stack gap={2}>
            <h2>Request errors</h2>
            {errors.map((error) => (
              <Text key={error} type="supporting">
                {error}
              </Text>
            ))}
          </Stack>
        </Card>
      )}
    </Stack>
  )
}
