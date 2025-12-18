'use client'

import { Skeleton, Card } from 'antd'
import styles from './RecommendedEventsSection.module.scss'
import skeletonStyles from './RecommendedEventsSectionSkeleton.module.scss'

export function RecommendedEventsSectionSkeleton() {
  return (
    <section style={{ marginTop: '48px', marginBottom: '48px', minHeight: '550px' }}>
      <Skeleton.Input 
        active 
        size="large" 
        style={{ 
          width: '300px', 
          height: '40px', 
          marginBottom: '24px',
          display: 'block'
        }} 
      />
      <div className={styles.carouselWrapper}>
        <div className={skeletonStyles.skeletonContainer}>
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i} 
              className={skeletonStyles.skeletonCard}
            >
              <Card>
                <Skeleton 
                  active 
                  avatar={{ shape: 'square', size: 'large' }}
                  paragraph={{ rows: 4 }}
                  title={{ width: '80%' }}
                />
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

