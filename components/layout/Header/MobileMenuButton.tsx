'use client'

import { Popover, Button } from 'antd'
import type { MenuProps } from 'antd'
import { MenuOutlined } from '@ant-design/icons'
import { Menu } from 'antd'

interface MobileMenuButtonProps {
  menuItems: MenuProps['items']
  selectedKey: string | null
}

export function MobileMenuButton({ menuItems, selectedKey }: MobileMenuButtonProps) {
  const mobileMenuContent = (
    <Menu
      mode="vertical"
      selectedKeys={selectedKey ? [selectedKey] : []}
      items={menuItems}
      style={{ border: 'none', minWidth: 200 }}
    />
  )

  return (
    <Popover
      content={mobileMenuContent}
      trigger="click"
      placement="bottomRight"
    >
      <Button
        type="text"
        icon={<MenuOutlined />}
      />
    </Popover>
  )
}

