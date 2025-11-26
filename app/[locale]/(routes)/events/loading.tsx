import { Skeleton } from 'antd'

export default function EventsLoading() {
  return (
    <div className="default-padding-y">
      <div className="container">
        <Skeleton active paragraph={{ rows: 4 }} />
        <Skeleton active paragraph={{ rows: 4 }} />
        <Skeleton active paragraph={{ rows: 4 }} />
      </div>
    </div>
  )
}

