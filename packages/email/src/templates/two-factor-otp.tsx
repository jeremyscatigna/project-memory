import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface TwoFactorOTPEmailProps {
  otp: string;
  userName?: string;
  expiresIn?: string;
}

export function TwoFactorOTPEmail({
  otp,
  userName,
  expiresIn = "5 minutes",
}: TwoFactorOTPEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your SaaS Template verification code: {otp}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Verification Code</Heading>
          {userName && <Text style={text}>Hi {userName},</Text>}
          <Text style={text}>
            Enter this verification code to complete your sign-in:
          </Text>
          <Section style={codeContainer}>
            <Text style={code}>{otp}</Text>
          </Section>
          <Text style={text}>
            This code will expire in {expiresIn}. If you didn't request this
            code, please ignore this email or contact support if you have
            concerns.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            For security, never share this code with anyone. SaaS Template will
            never ask for your verification code.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "1.25",
  marginBottom: "24px",
};

const text = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "1.5",
  marginBottom: "16px",
};

const codeContainer = {
  background: "#f4f4f5",
  borderRadius: "8px",
  margin: "24px 0",
  padding: "24px",
  textAlign: "center" as const,
};

const code = {
  color: "#000000",
  fontSize: "36px",
  fontWeight: "700",
  letterSpacing: "8px",
  margin: "0",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "32px 0",
};

const footer = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "1.5",
};

export default TwoFactorOTPEmail;
