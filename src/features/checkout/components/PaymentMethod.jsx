import { CreditCard, Smartphone } from 'lucide-react'
import { PAYMENT_METHODS } from '../api'

const options = [
  { id: 'bkash', label: 'bKash', icon: Smartphone, detail: 'Mobile payment' },
  { id: 'nagad', label: 'Nagad', icon: Smartphone, detail: 'Mobile payment' },
  { id: 'rocket', label: 'Rocket', icon: Smartphone, detail: 'Mobile payment' },
  { id: 'bank_card', label: 'Bank card', icon: CreditCard, detail: 'Manual card payment' },
]

export default function PaymentMethod({
  method,
  onMethodChange,
  paymentAccountReference,
  onPaymentAccountReferenceChange,
  transactionNumber,
  onTransactionChange,
}) {
  const selected = options.find((option) => option.id === method)
  const isBankCard = method === 'bank_card'
  const accountLabel = isBankCard ? 'Card last 4 digits' : `${selected?.label ?? 'Wallet'} sender number`

  return (
    <div className="checkout-payment">
      <div className="checkout-payment__options">
        {options.map(({ id, label, icon: Icon, detail }) => (
          <label className={`checkout-payment-option${method === id ? ' checkout-payment-option--selected' : ''}`} key={id}>
            <input
              type="radio"
              name="payment-method"
              value={id}
              checked={method === id}
              onChange={() => onMethodChange(id)}
            />
            <Icon size={19} />
            <span><strong>{label}</strong><small>{detail}</small></span>
          </label>
        ))}
      </div>
      {selected && (
        <div className="checkout-payment__instructions">
          {method === 'bank_card' ? (
            <p>
              Pay using your bank’s card/payment service, then enter its transaction reference and only the last 4 digits of the card.{' '}
              <strong>Never enter your full card number, expiry date, or security code.</strong>
              <br />
              আপনার ব্যাংকের কার্ড/পেমেন্ট সেবা ব্যবহার করে পেমেন্ট করুন। এরপর ট্রানজ্যাকশন নম্বর এবং কার্ডের শুধু শেষ ৪টি সংখ্যা দিন।{' '}
              <strong>সম্পূর্ণ কার্ড নম্বর, মেয়াদ শেষের তারিখ বা নিরাপত্তা কোড দেবেন না।</strong>
            </p>
          ) : (
            <p>
              Send the payment to our {selected.label} merchant number <strong>01858233865</strong>, then enter your sender number and the transaction ID from your payment confirmation.
              <br />
              আমাদের {selected.label} মার্চেন্ট নম্বরে <strong>01858233865</strong> পেমেন্ট পাঠান। এরপর যে নম্বর থেকে টাকা পাঠিয়েছেন এবং পেমেন্ট নিশ্চিতকরণে পাওয়া ট্রানজ্যাকশন আইডি লিখুন।
            </p>
          )}
        </div>
      )}
      <label className="admin-field checkout-transaction-field">
        <span>{accountLabel} / {isBankCard ? 'কার্ডের শেষ ৪টি সংখ্যা' : 'যে নম্বর থেকে টাকা পাঠিয়েছেন'}</span>
        <input
          required
          type="text"
          inputMode={isBankCard ? 'numeric' : 'tel'}
          autoComplete="off"
          maxLength={isBankCard ? 4 : 14}
          pattern={isBankCard ? '[0-9]{4}' : '(01[3-9][0-9]{8}|\\+?8801[3-9][0-9]{8})'}
          value={paymentAccountReference}
          onChange={(event) => onPaymentAccountReferenceChange(event.target.value)}
          placeholder={isBankCard ? 'Last 4 digits only / শুধু শেষ ৪টি সংখ্যা' : 'e.g. 01XXXXXXXXX'}
          aria-describedby="payment-account-hint"
        />
      </label>
      <label className="admin-field checkout-transaction-field">
        <span>Transaction / reference number / ট্রানজ্যাকশন বা রেফারেন্স নম্বর</span>
        <input
          required
          maxLength="120"
          autoComplete="off"
          value={transactionNumber}
          onChange={(event) => onTransactionChange(event.target.value)}
          placeholder="Enter the payment reference / পেমেন্ট রেফারেন্স লিখুন"
        />
      </label>
      <small id="payment-account-hint" className="checkout-payment__notice">
        {isBankCard
          ? 'For card payments, only the last 4 digits are collected; no full card details are stored. / কার্ড পেমেন্টে শুধু শেষ ৪টি সংখ্যা নেওয়া হয়; সম্পূর্ণ কার্ডের তথ্য সংরক্ষণ করা হয় না।'
          : 'Enter the mobile number used to send the payment. / যে মোবাইল নম্বর থেকে পেমেন্ট পাঠিয়েছেন সেটি লিখুন।'}
      </small>
      <p className="checkout-payment__notice">
        {PAYMENT_METHODS.includes(method)
          ? 'Payment is recorded as pending verification. We will confirm it before processing your order. / পেমেন্ট যাচাইয়ের অপেক্ষায় থাকবে। অর্ডার প্রক্রিয়া করার আগে আমরা পেমেন্ট নিশ্চিত করব।'
          : ''}
      </p>
    </div>
  )
}