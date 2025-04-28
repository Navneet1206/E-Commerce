import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

function PaymentSuccessPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold mb-4">Order Placed Successfully!</h1>
      <p className="mb-4">Thank you for your purchase. You'll receive a confirmation soon.</p>
      <Button onClick={() => navigate('/shop/home')}>Return to Home</Button>
    </div>
  );
}

export default PaymentSuccessPage;