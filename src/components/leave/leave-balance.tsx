import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function LeaveBalance() {
  // Dummy data for leave balance
  const balance = {
    annual: 10,
    sick: 5,
    casual: 3,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave Balance</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          <li>Annual Leave: {balance.annual} days</li>
          <li>Sick Leave: {balance.sick} days</li>
          <li>Casual Leave: {balance.casual} days</li>
        </ul>
      </CardContent>
    </Card>
  );
}
