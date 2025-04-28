import Address from '@/components/shopping-view/address';
import img from '../../assets/account.jpg';
import { useDispatch, useSelector } from 'react-redux';
import UserCartItemsContent from '@/components/shopping-view/cart-items-content';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { createNewOrder, verifyRazorpayPayment } from '@/store/shop/order-slice';
import { fetchCartItems } from '@/store/shop/cart-slice'; // Import cart action
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

function ShoppingCheckout() {
  const { cartItems, isLoading: cartLoading } = useSelector((state) => state.shopCart); // Use shopCart slice
  const { user } = useSelector((state) => state.auth);
  const [currentSelectedAddress, setCurrentSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [isPaymentStart, setIsPaymentStart] = useState(false);
  const dispatch = useDispatch();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch cart items on mount
  useEffect(() => {
    if (user?.id) {
      dispatch(fetchCartItems(user.id));
    }
  }, [dispatch, user]);

  // Calculate total cart amount
  const totalCartAmount =
    cartItems?.items?.length > 0
      ? cartItems.items.reduce((sum, item) => {
          const price = item.salePrice > 0 ? item.salePrice : item.price;
          return sum + price * item.quantity;
        }, 0)
      : 0;

  // Debug logs
  useEffect(() => {
    console.log('Cart Items:', cartItems);
    console.log('Total Cart Amount:', totalCartAmount);
  }, [cartItems, totalCartAmount]);

  function handleInitiatePayment() {
    if (!cartItems?.items?.length) {
      toast({
        title: 'Your cart is empty. Please add items to proceed.',
        variant: 'destructive',
      });
      return;
    }
    if (!currentSelectedAddress) {
      toast({
        title: 'Please select one address to proceed.',
        variant: 'destructive',
      });
      return;
    }

    const orderData = {
      userId: user?.id,
      cartId: cartItems?._id,
      cartItems: cartItems.items.map((item) => ({
        productId: item.productId,
        title: item.title,
        image: item.image,
        price: item.salePrice > 0 ? item.salePrice : item.price,
        quantity: item.quantity,
      })),
      addressInfo: {
        addressId: currentSelectedAddress._id,
        address: currentSelectedAddress.address,
        city: currentSelectedAddress.city,
        pincode: currentSelectedAddress.pincode,
        phone: currentSelectedAddress.phone,
        notes: currentSelectedAddress.notes,
      },
      orderStatus: 'pending',
      paymentMethod,
      paymentStatus: 'pending',
      totalAmount: totalCartAmount,
      orderDate: new Date(),
      orderUpdateDate: new Date(),
    };

    console.log('Order Data:', orderData);

    dispatch(createNewOrder(orderData)).then((data) => {
      console.log('Create Order Response:', data);
      if (data?.payload?.success) {
        setIsPaymentStart(true);
        if (paymentMethod === 'razorpay') {
          const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: data.payload.amount,
            currency: data.payload.currency,
            name: 'Ecommerce Shop',
            description: 'Order Payment',
            order_id: data.payload.razorpayOrderId,
            handler: function (response) {
              console.log('Razorpay Response:', response);
              dispatch(
                verifyRazorpayPayment({
                  orderId: data.payload.orderId,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpaySignature: response.razorpay_signature,
                })
              ).then((verifyData) => {
                console.log('Verify Payment Response:', verifyData);
                if (verifyData?.payload?.success) {
                  dispatch(fetchCartItems(user.id)); // Refresh cart
                  navigate('/shop/payment-success');
                } else {
                  toast({
                    title: 'Payment verification failed.',
                    variant: 'destructive',
                  });
                  setIsPaymentStart(false);
                }
              });
            },
            prefill: {
              name: user.userName,
              email: user.email,
              contact: '9999999999', // Replace with user phone if available
            },
            theme: {
              color: '#3399cc',
            },
          };
          const rzp = new window.Razorpay(options);
          rzp.on('payment.failed', function (response) {
            console.error('Razorpay Payment Failed:', response);
            toast({
              title: 'Payment failed. Please try again.',
              variant: 'destructive',
            });
            setIsPaymentStart(false);
          });
          rzp.open();
        } else if (paymentMethod === 'cod') {
          dispatch(fetchCartItems(user.id)); // Refresh cart
          navigate('/shop/payment-success');
        }
      } else {
        toast({
          title: 'Failed to create order. Please try again.',
          variant: 'destructive',
        });
        setIsPaymentStart(false);
      }
    });
  }

  // Load Razorpay script
  useEffect(() => {
    if (!window.Razorpay && paymentMethod === 'razorpay') {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => console.log('Razorpay script loaded');
      script.onerror = () => console.error('Failed to load Razorpay script');
      document.body.appendChild(script);
    }
  }, [paymentMethod]);

  return (
    <div className="flex flex-col">
      {cartLoading && <p>Loading cart...</p>}
      <div className="relative h-[300px] w-full overflow-hidden">
        <img src={img} className="h-full w-full object-cover object-center" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5 p-5">
        <Address
          selectedId={currentSelectedAddress}
          setCurrentSelectedAddress={setCurrentSelectedAddress}
        />
        <div className="flex flex-col gap-4">
          {cartItems?.items?.length > 0 ? (
            cartItems.items.map((item) => (
              <UserCartItemsContent key={item.productId} cartItem={item} />
            ))
          ) : (
            <p>Your cart is empty.</p>
          )}
          <div className="mt-8 space-y-4">
            <div className="flex justify-between">
              <span className="font-bold">Total</span>
              <span className="font-bold">₹{totalCartAmount.toFixed(2)}</span>
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-medium">Select Payment Method:</label>
              <div className="flex gap-4">
                <label>
                  <input
                    type="radio"
                    value="razorpay"
                    checked={paymentMethod === 'razorpay'}
                    onChange={() => setPaymentMethod('razorpay')}
                  /> Razorpay
                </label>
                <label>
                  <input
                    type="radio"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                  /> Cash on Delivery
                </label>
              </div>
            </div>
          </div>
          <div className="mt-4 w-full">
            <Button
              onClick={handleInitiatePayment}
              className="w-full"
              disabled={isPaymentStart || totalCartAmount === 0 || cartLoading}
            >
              {isPaymentStart
                ? paymentMethod === 'razorpay'
                  ? 'Processing Razorpay Payment...'
                  : 'Placing COD Order...'
                : `Checkout with ${paymentMethod === 'razorpay' ? 'Razorpay' : 'COD'}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShoppingCheckout;