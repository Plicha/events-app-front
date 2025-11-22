import { Skeleton } from 'antd'

export default function EventsLoading() {
  return (
    <div>
      <Skeleton active paragraph={{ rows: 4 }} />
      <Skeleton active paragraph={{ rows: 4 }} />
      <Skeleton active paragraph={{ rows: 4 }} />
    </div>
  )
}

