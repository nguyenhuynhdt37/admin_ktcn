import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Users, ShoppingBag, DollarSign, Activity, ArrowUpRight } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

export function DashboardPage() {
  const stats = [
    {
      title: 'Doanh thu tháng',
      value: '$45,231.89',
      description: '+20.1% so với tháng trước',
      icon: DollarSign,
    },
    {
      title: 'Thành viên mới',
      value: '+2,350',
      description: '+180.1% so với tháng trước',
      icon: Users,
    },
    {
      title: 'Đơn hàng mới',
      value: '+12,234',
      description: '+19% so với tháng trước',
      icon: ShoppingBag,
    },
    {
      title: 'Hoạt động hiện tại',
      value: '+573',
      description: '+201 giờ qua',
      icon: Activity,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tổng quan</h2>
          <p className="text-muted-foreground">Báo cáo tình hình hoạt động của hệ thống.</p>
        </div>
        <Button className="cursor-pointer">
          Tải báo cáo <ArrowUpRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="bg-card text-card-foreground">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-card">
          <CardHeader>
            <CardTitle>Biểu đồ phân tích</CardTitle>
            <CardDescription>Hiển thị lưu lượng truy cập hệ thống theo thời gian thực.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center border border-dashed m-6 rounded-md bg-muted/20">
            <div className="text-muted-foreground text-sm font-medium">
              [Biểu đồ phân tích hệ thống hoạt động]
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-card">
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
            <CardDescription>Lịch sử hoạt động của các thành viên.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: 'Nguyễn Văn A', action: 'Đăng nhập vào hệ thống', time: '2 phút trước' },
              { name: 'Trần Thị B', action: 'Cập nhật cấu hình profile', time: '10 phút trước' },
              { name: 'Lê Văn C', action: 'Xóa danh mục sản phẩm ID #41', time: '1 giờ trước' },
              { name: 'Phạm Minh D', action: 'Tải xuất dữ liệu Excel', time: '4 giờ trước' },
            ].map((activity, i) => (
              <div key={i} className="flex items-center justify-between text-sm border-b pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium text-foreground">{activity.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{activity.action}</p>
                </div>
                <span className="text-xs text-muted-foreground font-mono">{activity.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
export default DashboardPage
