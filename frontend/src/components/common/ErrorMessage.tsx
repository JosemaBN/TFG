type ErrorMessageProps = {
  message: string;
};

export default function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <p className="error" role="alert">
      {message}
    </p>
  );
}
