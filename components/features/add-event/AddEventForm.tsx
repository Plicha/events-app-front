'use client'

import '@/lib/antd-patch'
import { useState, useEffect } from 'react'
import {
  App,
  Form,
  Input,
  DatePicker,
  Select,
  Radio,
  Checkbox,
  Upload,
  Button,
  Space,
} from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import 'dayjs/locale/pl'
import 'dayjs/locale/en'
import { useTranslations } from 'next-intl'
import type { Category } from '@/types'
import { InboxOutlined } from '@ant-design/icons'
import styles from './AddEventForm.module.scss'

const { TextArea } = Input

const TITLE_MAX = 200
const DEFAULT_EVENT_HOUR = 18
const DEFAULT_EVENT_MINUTE = 0
const DESCRIPTION_MAX = 1500
const VENUE_MAX = 200
const CITY_MAX = 100
const SOURCE_LINK_MAX = 500
const PHOTO_MAX_SIZE_MB = 2
const PHOTO_MAX_SIZE_BYTES = PHOTO_MAX_SIZE_MB * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function getCategoryName(category: Category, locale: string): string {
  if (typeof category.name === 'string') return category.name
  return category.name[locale as 'pl' | 'en'] || category.name.pl || category.name.en || ''
}

function PriceAmountInput(props: React.ComponentProps<typeof Input>) {
  return (
    <Space.Compact block size="large">
      <Input type="number" size="large" min={0} step={0.01} {...props} />
      <Space.Addon>PLN</Space.Addon>
    </Space.Compact>
  )
}

interface AddEventFormProps {
  categories: Category[]
  locale: string
}

export function AddEventForm({ categories, locale }: AddEventFormProps) {
  const t = useTranslations('addEvent')
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const priceType = Form.useWatch('priceType', form) ?? 'free'

  useEffect(() => {
    dayjs.locale(locale === 'pl' ? 'pl' : 'en')
  }, [locale])

  const categoryOptions = categories.map((cat) => ({
    label: getCategoryName(cat, locale),
    value: String(cat.id),
  }))

  const handleFinish = async (values: Record<string, unknown>) => {
    setSubmitting(true)
    try {
      const formData = new FormData()

      formData.append('email', String(values.email))
      formData.append('title', String(values.title))
      formData.append('description', String(values.description))
      formData.append('categoryId', String(values.categoryId))

      const startsAt = values.startsAt as Dayjs | undefined
      const endsAt = values.endsAt as Dayjs | undefined
      if (startsAt) {
        formData.append('startsAt', startsAt.toISOString())
      }
      if (endsAt) {
        formData.append('endsAt', endsAt.toISOString())
      }

      if (values.venue) formData.append('venue', String(values.venue))
      if (values.city) formData.append('city', String(values.city))
      if (values.sourceLink) formData.append('sourceLink', String(values.sourceLink))

      formData.append('priceType', priceType)
      if (priceType === 'paid' && values.priceAmount != null) {
        formData.append('priceAmount', String(values.priceAmount))
      }

      formData.append('contentRights', String(!!values.contentRights))
      formData.append('termsAccepted', String(!!values.termsAccepted))

      if (values.fax) formData.append('fax', String(values.fax))

      if (photoFile) {
        formData.append('photo', photoFile)
      }

      const response = await fetch('/api/event-submission', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json().catch(() => ({}))
      const errorMessage = data.error || data.message

      if (!response.ok) {
        if (response.status === 429) {
          message.error(t('rateLimitError'))
        } else {
          message.error(errorMessage || t('submitError'))
        }
        return
      }

      message.success(t('successMessage'))
      form.resetFields()
      setPhotoFile(null)
    } catch (err) {
      message.error(t('submitError'))
      if (process.env.NODE_ENV === 'development') {
        console.error('Form submit error:', err)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const beforePhotoUpload = (file: File) => {
    if (file.size > PHOTO_MAX_SIZE_BYTES) {
      message.error(t('photoSizeError', { max: PHOTO_MAX_SIZE_MB }))
      return false
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      message.error(t('photoTypeError'))
      return false
    }
    setPhotoFile(file)
    return false
  }

  const removePhoto = () => {
    setPhotoFile(null)
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      style={{ maxWidth: 600, marginTop: 24 }}
    >
      <Form.Item
        name="fax"
        style={{ position: 'absolute', left: -9999, top: -9999, width: 1, height: 1, overflow: 'hidden', margin: 0, padding: 0 }}
      >
        <Input tabIndex={-1} autoComplete="nope" aria-hidden />
      </Form.Item>

      <Form.Item
        name="email"
        label={t('email')}
        rules={[
          { required: true, message: t('emailRequired') },
          { type: 'email', message: t('emailInvalid') },
          { max: 254, message: t('emailMax') },
        ]}
      >
        <span className='ant-input-affix-wrapper ant-input-affix-wrapper-lg css-dev-only-do-not-override-rglv8m ant-input-outlined'>
          <Input type="email" name="email" size="large" maxLength={254} autoComplete="email" />
        </span>
      </Form.Item>

      <Form.Item
        name="title"
        label={t('titleLabel')}
        rules={[
          { required: true, message: t('titleRequired') },
          { min: 2, message: t('titleMin') },
          { max: TITLE_MAX, message: t('titleMax', { max: TITLE_MAX }) },
        ]}
      >
        <Input
          size="large"
          maxLength={TITLE_MAX}
          showCount
          count={{ max: TITLE_MAX }}
        />
      </Form.Item>

      <Form.Item
        name="startsAt"
        label={t('startsAtLabel')}
        rules={[{ required: true, message: t('dateRequired') }]}
      >
        <DatePicker
          size="large"
          format={locale === 'pl' ? 'DD.MM.YYYY HH:mm' : 'YYYY-MM-DD HH:mm'}
          style={{ width: '100%' }}
          showNow={false}
          needConfirm={false}
          showTime={{
            format: 'HH:mm',
            defaultValue: dayjs().hour(DEFAULT_EVENT_HOUR).minute(DEFAULT_EVENT_MINUTE).second(0),
          }}
        />
      </Form.Item>

      <Form.Item
        className={styles.antFormItem}
        name="endsAt"
        label={t('endsAtLabel')}
        help={t('endsAtHint')}
        dependencies={['startsAt']}
        rules={[
          {
            validator: (_, value) => {
              if (!value) return Promise.resolve()
              const startsAt = form.getFieldValue('startsAt') as Dayjs | undefined
              if (startsAt && value.isBefore(startsAt)) {
                return Promise.reject(new Error(t('endsAtAfterStartError')))
              }
              return Promise.resolve()
            },
          },
        ]}
      >
        <DatePicker
          size="large"
          format={locale === 'pl' ? 'DD.MM.YYYY HH:mm' : 'YYYY-MM-DD HH:mm'}
          style={{ width: '100%' }}
          placeholder={t('endsAtPlaceholder')}
          showNow={false}
          needConfirm={false}
          showTime={{
            format: 'HH:mm',
            defaultValue: dayjs().hour(DEFAULT_EVENT_HOUR).minute(DEFAULT_EVENT_MINUTE).second(0),
          }}
        />
      </Form.Item>

      <Form.Item
        name="description"
        label={t('descriptionLabel')}
        rules={[
          { required: true, message: t('descriptionRequired') },
          { max: DESCRIPTION_MAX, message: t('descriptionMax', { max: DESCRIPTION_MAX }) },
        ]}
      >
        <TextArea
          rows={6}
          maxLength={DESCRIPTION_MAX}
          showCount
          count={{ max: DESCRIPTION_MAX }}
        />
      </Form.Item>

      <Form.Item name="venue" label={t('venue')}>
        <Input size="large" maxLength={VENUE_MAX} showCount count={{ max: VENUE_MAX }} />
      </Form.Item>

      <Form.Item name="city" label={t('city')}>
        <Input size="large" maxLength={CITY_MAX} showCount count={{ max: CITY_MAX }} />
      </Form.Item>

      <Form.Item
        name="categoryId"
        label={t('category')}
        rules={[{ required: true, message: t('categoryRequired') }]}
      >
        <Select
          size="large"
          placeholder={t('categoryPlaceholder')}
          options={categoryOptions}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
          }
        />
      </Form.Item>

      <Form.Item name="sourceLink" label={t('sourceLink')}>
        <Input
          type="url"
          size="large"
          placeholder="https://"
          maxLength={SOURCE_LINK_MAX}
          showCount
          count={{ max: SOURCE_LINK_MAX }}
        />
      </Form.Item>

      <Form.Item name="priceType" initialValue="free">
        <Radio.Group id='priceType'>
          <Radio value="free">{t('priceFree')}</Radio>
          <Radio value="paid">{t('pricePaid')}</Radio>
        </Radio.Group>
      </Form.Item>

      {priceType === 'paid' && (
        <Form.Item name="priceAmount" label={t('priceAmount')}>
          <PriceAmountInput />
        </Form.Item>
      )}

      <Form.Item name="photo" label={t('photo')}>
        <Upload.Dragger
          id="photo"
          maxCount={1}
          beforeUpload={beforePhotoUpload}
          onRemove={removePhoto}
          accept={ALLOWED_IMAGE_TYPES.join(',')}
          fileList={photoFile ? [{ uid: '-1', name: photoFile.name, status: 'done' }] : []}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">{t('photoUploadText')}</p>
          <p className="ant-upload-hint">{t('photoUploadHint', { max: PHOTO_MAX_SIZE_MB })}</p>
        </Upload.Dragger>
      </Form.Item>


      <Form.Item
        name="contentRights"
        valuePropName="checked"
        rules={[{ required: true, message: t('contentRightsRequired') }]}
      >
        <Checkbox>{t('contentRights')}
          <span style={{ transform: 'translate(4px, -2px)', color: '#ff4d4f', display: 'inline-block' }}>*</span>
        </Checkbox>
      </Form.Item>

      <Form.Item
        name="termsAccepted"
        valuePropName="checked"
        rules={[{ required: true, message: t('termsRequired') }]}
      >
        <Checkbox>{t('termsAccepted')} 
          <span style={{ transform: 'translate(4px, -2px)', color: '#ff4d4f', display: 'inline-block' }}>*</span>
        </Checkbox>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" size="large" loading={submitting}>
          {t('submit')}
        </Button>
      </Form.Item>
    </Form>
  )
}
