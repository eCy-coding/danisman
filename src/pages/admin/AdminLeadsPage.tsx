import React from 'react';
import { Helmet } from 'react-helmet-async';
import { LeadCaptureForm } from '../../components/admin/leads/LeadCaptureForm';

export function AdminLeadsPage() {
  return (
    <>
      <Helmet>
        <title>Aday Yönetimi — eCyPro Admin</title>
      </Helmet>
      <main>
        <h1>Aday Kayıt</h1>
        <LeadCaptureForm />
      </main>
    </>
  );
}
