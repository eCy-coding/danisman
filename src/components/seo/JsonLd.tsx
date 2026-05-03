
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface JsonLdProps {
  data: Record<string, unknown>;
}

export const JsonLd: React.FC<JsonLdProps> = ({ data }) => {
  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(data)}
      </script>
    </Helmet>
  );
};
