import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <>
      <Helmet><title>Page Not Found - Code829</title></Helmet>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Result
          status="404"
          title="404"
          subTitle="Sorry, the page you visited does not exist."
          extra={<Button type="primary" onClick={() => navigate('/')}>Back Home</Button>}
        />
      </div>
    </>
  );
}
