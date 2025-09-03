import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar"

export const AppSidebar = () => {
  return (
    <Sidebar>
      <SidebarHeader className="dark:bg-gray-800"/>
      <SidebarContent className="dark:bg-gray-800">
        <SidebarGroup />
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter className="dark:bg-gray-800"/>
    </Sidebar>
  )
}