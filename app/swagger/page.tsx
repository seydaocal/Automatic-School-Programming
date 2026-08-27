'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function SwaggerPage() {
  return (
    <div style={{ background: '#fff', minHeight: '100vh', padding: '24px' }}>
      <SwaggerUI url="/api/swagger" />
    </div>
  );
}