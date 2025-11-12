import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: "yunus@demo.com",
      password: "123",
      email_confirm: true,
    });

    if (authError) {
      console.error("Auth error:", authError);
    }

    if (authData?.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: authData.user.id,
            email: "yunus@demo.com",
            full_name: "Yunus",
            role: "admin",
          },
          { onConflict: "id" }
        );

      if (profileError) {
        console.error("Profile error:", profileError);
      }
    }

    const demoClientId = "10000000-0000-0000-0000-000000000001";
    const demoTemplateId = "20000000-0000-0000-0000-000000000001";
    const demoTaskId = "30000000-0000-0000-0000-000000000001";
    const demoChecklistId = "50000000-0000-0000-0000-000000000001";

    const userId = authData?.user?.id || "00000000-0000-0000-0000-000000000001";

    await supabase.from("clients").upsert(
      [
        {
          id: demoClientId,
          name: "ABC Şirketi",
          contact_person: "Ahmet Yılmaz",
          email: "ahmet@abc.com",
          phone: "+90 212 555 0001",
          address: "İstanbul, Türkiye",
          created_by: userId,
        },
        {
          id: "10000000-0000-0000-0000-000000000002",
          name: "XYZ Işletmesi",
          contact_person: "Fatima Kaya",
          email: "fatima@xyz.com",
          phone: "+90 216 555 0002",
          address: "Ankara, Türkiye",
          created_by: userId,
        },
      ],
      { onConflict: "id" }
    );

    await supabase.from("form_templates").upsert(
      [
        {
          id: demoTemplateId,
          name: "Mali Denetim Şablonu",
          template_type: "financial_audit",
          content: {
            sections: [
              {
                title: "Genel Bilgiler",
                fields: ["company_name", "audit_date", "auditor_name"],
              },
            ],
          },
          created_by: userId,
        },
        {
          id: "20000000-0000-0000-0000-000000000002",
          name: "Uyum Denetimi Şablonu",
          template_type: "compliance_audit",
          content: { sections: [] },
          created_by: userId,
        },
        {
          id: "20000000-0000-0000-0000-000000000003",
          name: "Bilgi Sistemleri Şablonu",
          template_type: "information_systems_audit",
          content: {
            sections: [
              {
                title: "Sistem Yönetimi",
                fields: ["system_inventory", "access_controls", "backup_procedures"],
              },
              {
                title: "Güvenlik",
                fields: ["security_policies", "vulnerability_assessment", "incident_response"],
              },
            ],
          },
          created_by: userId,
        },
      ],
      { onConflict: "id" }
    );

    await supabase.from("tasks").upsert(
      [
        {
          id: demoTaskId,
          title: "2024 Mali Denetimi",
          description: "ABC Şirketi için yıllık mali denetim",
          client_id: demoClientId,
          status: "in_progress",
          assigned_to: [userId],
          created_by: userId,
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
      { onConflict: "id" }
    );

    await supabase.from("audits").upsert(
      [
        {
          id: "40000000-0000-0000-0000-000000000001",
          client_id: demoClientId,
          task_id: demoTaskId,
          form_template_id: demoTemplateId,
          status: "in_progress",
          form_data: {},
          created_by: userId,
        },
      ],
      { onConflict: "id" }
    );

    await supabase.from("checklists").upsert(
      [
        {
          id: demoChecklistId,
          client_id: demoClientId,
          title: "ABC Şirketi Denetim Kontrol Listesi",
          created_by: userId,
        },
      ],
      { onConflict: "id" }
    );

    await supabase.from("checklist_items").upsert(
      [
        {
          id: "51000000-0000-0000-0000-000000000001",
          checklist_id: demoChecklistId,
          description: "Mali tablolar gözden geçirildi",
          is_checked: true,
          order_index: 1,
        },
        {
          id: "51000000-0000-0000-0000-000000000002",
          checklist_id: demoChecklistId,
          description: "Kaynaklar doğrulandı",
          is_checked: true,
          order_index: 2,
        },
        {
          id: "51000000-0000-0000-0000-000000000003",
          checklist_id: demoChecklistId,
          description: "İç kontroller değerlendirildi",
          is_checked: false,
          order_index: 3,
        },
        {
          id: "51000000-0000-0000-0000-000000000004",
          checklist_id: demoChecklistId,
          description: "Rapor hazırlandı",
          is_checked: false,
          order_index: 4,
        },
      ],
      { onConflict: "id" }
    );

    await supabase.from("folders").upsert(
      [
        {
          id: "60000000-0000-0000-0000-000000000001",
          client_id: demoClientId,
          name: "Toplantı Notları 2024",
          folder_type: "meeting_notes",
          created_by: userId,
        },
        {
          id: "60000000-0000-0000-0000-000000000002",
          client_id: demoClientId,
          name: "Çalışma Kağıtları",
          folder_type: "working_papers",
          created_by: userId,
        },
        {
          id: "60000000-0000-0000-0000-000000000003",
          client_id: demoClientId,
          name: "Sözleşmeler",
          folder_type: "contracts",
          created_by: userId,
        },
        {
          id: "60000000-0000-0000-0000-000000000004",
          client_id: demoClientId,
          name: "Şirketten Gelen Kanıtlar",
          folder_type: "evidence",
          created_by: userId,
        },
      ],
      { onConflict: "id" }
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Demo user and data created successfully",
        user: {
          email: "yunus@demo.com",
          password: "123",
        },
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
