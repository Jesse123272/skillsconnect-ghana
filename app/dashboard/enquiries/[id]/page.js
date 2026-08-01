import { redirect } from 'next/navigation';

export default function EnquiryDetailRedirect({ params }) {
  const { id } = params;
  redirect(`/dashboard/customer/enquiries/${id}`);
}
