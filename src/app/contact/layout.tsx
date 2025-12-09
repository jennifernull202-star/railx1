import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | The Rail Exchange™',
  description: 'Get in touch with The Rail Exchange™ team for support, questions, or partnership inquiries.',
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
