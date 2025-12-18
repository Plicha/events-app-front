'use client'

import { useRef, useState, useEffect } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import 'swiper/css'
import 'swiper/css/navigation'
import type { Event } from '@/types'
import { EventCard } from '@/components/features/events/EventCard/EventCard'
import styles from './RecommendedEventsSection.module.scss'

interface RecommendedEventsCarouselProps {
  events: Event[]
  locale: string
}

export function RecommendedEventsCarousel({ events, locale }: RecommendedEventsCarouselProps) {
  const swiperRef = useRef<SwiperType | null>(null)
  const [isBeginning, setIsBeginning] = useState(true)
  const [isEnd, setIsEnd] = useState(false)

  useEffect(() => {
    if (swiperRef.current) {
      setIsBeginning(swiperRef.current.isBeginning)
      setIsEnd(swiperRef.current.isEnd)
    }
  }, [events])

  if (events.length === 0) {
    return null
  }

  return (
    <div className={styles.carouselContainer}>
      <button
        className={styles.navButtonPrev}
        onClick={() => swiperRef.current?.slidePrev()}
        aria-label="Previous slide"
        disabled={isBeginning}
      >
        <LeftOutlined />
      </button>
      <div className={styles.carouselWrapper}>
        <Swiper
          modules={[Navigation]}
          spaceBetween={16}
          slidesPerView={5}
          onSwiper={(swiper) => {
            swiperRef.current = swiper
            setIsBeginning(swiper.isBeginning)
            setIsEnd(swiper.isEnd)
          }}
          onSlideChange={(swiper) => {
            setIsBeginning(swiper.isBeginning)
            setIsEnd(swiper.isEnd)
          }}
          breakpoints={{
            0: {
              slidesPerView: 1.2,
              spaceBetween: 12,
            },
            576: {
              slidesPerView: 2,
              spaceBetween: 16,
            },
            768: {
              slidesPerView: 3,
              spaceBetween: 16,
            },
            1200: {
              slidesPerView: 4,
              spaceBetween: 16,
            },
          }}
          className={styles.carousel}
        >
          {events.map((event) => (
            <SwiperSlide key={event.id} className={styles.slide}>
              <EventCard event={event} locale={locale} layout="vertical" />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      <button
        className={styles.navButtonNext}
        onClick={() => swiperRef.current?.slideNext()}
        aria-label="Next slide"
        disabled={isEnd}
      >
        <RightOutlined />
      </button>
      <div className={styles.navButtonsContainer}>
        <button
          className={styles.navButtonPrevMobile}
          onClick={() => swiperRef.current?.slidePrev()}
          aria-label="Previous slide"
          disabled={isBeginning}
        >
          <LeftOutlined />
        </button>
        <button
          className={styles.navButtonNextMobile}
          onClick={() => swiperRef.current?.slideNext()}
          aria-label="Next slide"
          disabled={isEnd}
        >
          <RightOutlined />
        </button>
      </div>
    </div>
  )
}

