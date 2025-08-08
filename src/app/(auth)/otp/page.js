import OtpContent from "@/components/OtpContent";

const OTP = async ({ searchParams }) => {
  const awaitedSearchParams = await searchParams;

  let phoneNumber = awaitedSearchParams?.phoneNumber || null;

  if (phoneNumber && !phoneNumber.startsWith("+")) {
    phoneNumber = "+1" + phoneNumber;
  }

  return <OtpContent phoneNumber={phoneNumber} />;
};

export default OTP;
