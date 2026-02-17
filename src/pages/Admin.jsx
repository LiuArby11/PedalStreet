  import { useEffect, useState } from 'react';
  import { supabase } from '../supabaseClient';
  import Modal from '../components/Modal';
  import Toast from '../components/Toast';
  import ActionProgressBar from '../components/ActionProgressBar';
  import { 
    XAxis, YAxis, Tooltip, ResponsiveContainer, 
    AreaChart, Area 
  } from 'recharts';

  export default function Admin({ darkMode, session, userProfile }) {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [vouchers, setVouchers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [users, setUsers] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [editingId, setEditingId] = useState(null);
    
    const [storageImages, setStorageImages] = useState([]);
    const [showPicker, setShowPicker] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [form, setForm] = useState({ name: '', price: '', category: '', description: '', image_url: '', stock: 0 });
    const [vForm, setVForm] = useState({ code: '', discount_percent: '' });
    const [categoryForm, setCategoryForm] = useState({ code: '', label: '' });
    const [variantDrafts, setVariantDrafts] = useState([{ size: '', color: '', stock: 0 }]);
    const [variantMap, setVariantMap] = useState({});

    const [loading, setLoading] = useState(false);
    const [auditLoading, setAuditLoading] = useState(false);
    const [productsLoading, setProductsLoading] = useState(false);
    const [vouchersLoading, setVouchersLoading] = useState(false);
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [usersLoading, setUsersLoading] = useState(false);
    const [actionBusy, setActionBusy] = useState(false);
    const [orderActionId, setOrderActionId] = useState(null);
    const [restoringLogId, setRestoringLogId] = useState(null);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [orderSearch, setOrderSearch] = useState('');
    const [productViewFilter, setProductViewFilter] = useState('ACTIVE');
    const [productSort, setProductSort] = useState('NEWEST');
    const [productPage, setProductPage] = useState(1);
    const [productPageSize, setProductPageSize] = useState(12);
    const [orderPage, setOrderPage] = useState(1);
    const [categoryPage, setCategoryPage] = useState(1);
    const [userPage, setUserPage] = useState(1);
    const [voucherPage, setVoucherPage] = useState(1);
    const [auditPage, setAuditPage] = useState(1);
    const [userSearch, setUserSearch] = useState('');
    const [variantCopySource, setVariantCopySource] = useState('');
    const [currentAdmin, setCurrentAdmin] = useState({ id: null, email: '', name: '', username: '' });
    const [modal, setModal] = useState({ open: false, type: "info", title: "", message: "" });
    const [confirmAction, setConfirmAction] = useState(null);
    const [toast, setToast] = useState({ open: false, type: "info", title: "", message: "", duration: 3200 });
    
    const themeCard = darkMode ? 'bg-[#0d0e12] border-white/5 shadow-2xl' : 'bg-white border-gray-200 shadow-xl';
    const themeTextMain = darkMode ? 'text-white' : 'text-gray-900';
    const themeTextSub = darkMode ? 'text-gray-500' : 'text-gray-600';
    const themeInput = darkMode ? 'bg-black border-white/5 text-white' : 'bg-gray-100 border-gray-300 text-black';
    const themeSidebar = darkMode ? 'bg-[#0d0e12] border-white/5' : 'bg-white border-gray-200';
    const actionBtnBase = 'text-[9px] font-black uppercase px-6 lg:px-8 py-4 rounded-2xl transition-all active:scale-95 hover:shadow-lg';

    useEffect(() => {
      fetchProducts();
      fetchOrders();
      fetchVouchers();
      fetchCategories();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      const syncCurrentAdmin = async () => {
        const resolveName = (profile, email) => {
          const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim();
          return fullName || profile?.username || email?.split('@')[0] || 'Unknown Admin';
        };

        if (session?.user?.id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name, username')
            .eq('id', session.user.id)
            .maybeSingle();

          const profile = profileData || userProfile || null;
          const resolvedEmail = session.user.email || '';
          setCurrentAdmin({
            id: session.user.id,
            email: resolvedEmail,
            username: profile?.username || '',
            name: resolveName(profile, resolvedEmail)
          });
          return;
        }

        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        if (user?.id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name, username')
            .eq('id', user.id)
            .maybeSingle();

          const resolvedEmail = user.email || '';
          setCurrentAdmin({
            id: user.id,
            email: resolvedEmail,
            username: profileData?.username || '',
            name: resolveName(profileData, resolvedEmail)
          });
        }
      };

      syncCurrentAdmin();
    }, [session, userProfile]);

    const showModal = (type, title, message) => {
      setToast({ open: true, type, title, message, duration: 3200 });
    };

    const openConfirm = (title, message, action, options = {}) => {
      setConfirmAction(() => async () => {
        setActionBusy(true);
        try {
          await action();
          setModal((prev) => ({ ...prev, open: false }));
          setConfirmAction(null);
        } finally {
          setActionBusy(false);
        }
      });
      setModal({
        open: true,
        type: "confirm",
        title,
        message,
        confirmTone: options.confirmTone || 'default',
        confirmLabel: options.confirmLabel || 'CONFIRM',
        cancelLabel: options.cancelLabel || 'CANCEL',
      });
    };

    const fetchStorageImages = async () => {
      const { data, error } = await supabase.storage.from('product-images').list('', {
        limit: 100,
        sortBy: { column: 'name', order: 'desc' },
      });
      if (data) {
        setStorageImages(data);
      }
      if (error) console.error("Storage Error:", error.message);
    };

    useEffect(() => {
      if (showPicker) fetchStorageImages();
    }, [showPicker]);

    const handleUpload = async (e) => {
      try {
        const file = e.target.files[0];
        if (!file) return;

        setActionBusy(true);
        setUploading(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`; 

        const { error } = await supabase.storage
          .from('product-images')
          .upload(fileName, file);

        if (error) throw error;

        showModal("success", "SYNCED", "Image uploaded and ready to use.");
        fetchStorageImages(); 
      } catch (err) {
        showModal("error", "UPLOAD FAILED", err.message);
      } finally {
        setUploading(false);
        setActionBusy(false);
      }
    };

    const fetchProducts = async () => {
      setProductsLoading(true);
      try {
        const { data } = await supabase.from('products').select('*').order('id', { ascending: false });
        setProducts((data || []).map((p) => ({ ...p, is_archived: !!p.is_archived })));
      } finally {
        setProductsLoading(false);
      }
    };

    const fetchVariantStocks = async (productList = products) => {
      const ids = (productList || []).map((p) => p.id).filter(Boolean);
      if (ids.length === 0) {
        setVariantMap({});
        return;
      }

      const { data, error } = await supabase
        .from('product_variant_stocks')
        .select('product_id, size, color, stock')
        .in('product_id', ids);

      if (error) {
        setVariantMap({});
        return;
      }

      const grouped = (data || []).reduce((acc, row) => {
        const key = String(row.product_id);
        if (!acc[key]) acc[key] = [];
        acc[key].push(row);
        return acc;
      }, {});
      setVariantMap(grouped);
    };

    const fetchVouchers = async () => {
      setVouchersLoading(true);
      try {
        const { data } = await supabase.from('vouchers').select('*').order('created_at', { ascending: false });
        setVouchers(data || []);
      } finally {
        setVouchersLoading(false);
      }
    };

    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const { data, error } = await supabase
          .from('product_categories')
          .select('*')
          .order('code', { ascending: true });
        if (error) throw error;
        setCategories(data || []);
      } catch (err) {
        console.error("Category Fetch Error:", err.message);
        const fallback = [...new Set(products.map((p) => String(p.category || '').trim().toUpperCase()).filter(Boolean))]
          .map((code, idx) => ({ id: `fallback-${idx}`, code, label: code, is_active: true }));
        setCategories(fallback);
      } finally {
        setCategoriesLoading(false);
      }
    };

    const fetchUsers = async () => {
      setUsersLoading(true);
      try {
        // Progressive fallbacks to support different profiles schemas.
        const attempts = [
          'id, first_name, last_name, username, email_copy, phone, is_admin',
          'id, first_name, last_name, username, email_copy, is_admin',
          'id, first_name, last_name, username, email, phone, is_admin',
          'id, first_name, last_name, username, email, is_admin',
          'id, first_name, last_name, username, is_admin',
          'id, username, is_admin',
        ];

        let rows = null;
        let lastError = null;

        for (const selectClause of attempts) {
          const res = await supabase.from('profiles').select(selectClause);
          if (!res.error) {
            rows = res.data || [];
            break;
          }
          lastError = res.error;
        }

        if (!rows) throw lastError || new Error('Unable to fetch users.');

        setUsers(rows.map((row) => ({
          id: row.id,
          first_name: row.first_name || '',
          last_name: row.last_name || '',
          username: row.username || '',
          email: row.email_copy || row.email || '',
          phone: row.phone || '',
          is_admin: !!row.is_admin,
          created_at: row.created_at || null,
        })));
      } catch (err) {
        console.error("User Fetch Error:", err.message);
        showModal("error", "USERS LOAD FAILED", err.message || "Unable to fetch users.");
      } finally {
        setUsersLoading(false);
      }
    };

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            profiles:user_id (first_name, last_name, username),
            order_items (
              quantity, price, product_id,
              selected_size, selected_color,
              products!order_items_product_id_fkey (name, image_url)
            )
          `)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setOrders(data || []);
      } catch (err) {
        console.error("Order Fetch Error:", err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchAuditLogs = async () => {
      setAuditLoading(true);
      try {
        const { data, error } = await supabase
          .from('admin_audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(250);

        if (error) throw error;
        setAuditLogs(data || []);
      } catch (err) {
        console.error("Audit Fetch Error:", err.message);
      } finally {
        setAuditLoading(false);
      }
    };

    useEffect(() => {
      if (activeTab === 'audit') fetchAuditLogs();
      if (activeTab === 'users') fetchUsers();
      if (activeTab === 'categories') fetchCategories();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    useEffect(() => {
      if (categories.length === 0 && products.length > 0) {
        const fallback = [...new Set(products.map((p) => String(p.category || '').trim().toUpperCase()).filter(Boolean))]
          .map((code, idx) => ({ id: `fallback-${idx}`, code, label: code, is_active: true }));
        setCategories(fallback);
      }
    }, [products, categories.length]);

    const logAdminAction = async ({
      action,
      entityType,
      entityId,
      beforeData = null,
      afterData = null,
      metadata = null,
    }) => {
      try {
        const payload = {
          action,
          entity_type: entityType,
          entity_id: entityId ? String(entityId) : null,
          actor_id: currentAdmin.id,
          actor_email: currentAdmin.email || null,
          actor_name: currentAdmin.name || null,
          metadata: metadata ? { ...metadata, actor_username: currentAdmin.username || null } : { actor_username: currentAdmin.username || null },
          before_data: beforeData,
          after_data: afterData,
        };

        const { error } = await supabase.from('admin_audit_logs').insert([payload]);
        if (error) throw error;
      } catch (err) {
        console.error("Audit Log Error:", err.message);
      }
    };

    const sanitizeRestorePayload = (payload = {}) => {
      const cloned = { ...payload };
      delete cloned.profiles;
      delete cloned.products;
      delete cloned.order_items;
      return cloned;
    };

    const tryInsertWithFallback = async (table, payload) => {
      const primary = await supabase.from(table).insert([payload]);
      if (!primary.error) return { ok: true };

      const fallback = { ...payload };
      delete fallback.id;
      const retry = await supabase.from(table).insert([fallback]);
      if (!retry.error) return { ok: true };

      throw retry.error || primary.error;
    };

    const restoreAuditRecord = async (log) => {
      setRestoringLogId(log.id);
      setActionBusy(true);
      try {
        if (!log?.before_data) throw new Error('No Product found in audit log.');

        const tableMap = {
          PRODUCT: 'products',
          ORDER: 'orders',
          VOUCHER: 'vouchers',
        };

        const table = tableMap[log.entity_type];
        if (!table) throw new Error('Unsupported restore entity.');

        const restorePayload = sanitizeRestorePayload(log.before_data);
        const orderItemsSnapshot = Array.isArray(log.before_data?.order_items) ? log.before_data.order_items : [];

        if (log.entity_type === 'PRODUCT' && log.action === 'ARCHIVE') {
          const productId = log.entity_id || restorePayload.id;
          if (productId) {
            const { data: existingProduct } = await supabase
              .from('products')
              .select('id')
              .eq('id', productId)
              .maybeSingle();

            if (existingProduct?.id) {
              const { error: unarchiveError } = await supabase
                .from('products')
                .update({ is_archived: false, archived_at: null, archived_by: null })
                .eq('id', productId);

              if (unarchiveError) throw unarchiveError;
            } else {
              await tryInsertWithFallback('products', {
                ...restorePayload,
                is_archived: false,
                archived_at: null,
                archived_by: null,
              });
            }
          }
        } else {
          await tryInsertWithFallback(table, restorePayload);
        }

        if (table === 'orders' && orderItemsSnapshot.length > 0) {
          const orderId = restorePayload.id;
          if (orderId) {
            const itemRows = orderItemsSnapshot.map((item) => {
              const cleanItem = { ...item, order_id: orderId };
              delete cleanItem.products;
              delete cleanItem.id;
              return cleanItem;
            });
            const { error: itemsError } = await supabase.from('order_items').insert(itemRows);
            if (itemsError) console.error("Order Items Restore Error:", itemsError.message);
          }
        }

        await supabase
          .from('admin_audit_logs')
          .update({
            restored_at: new Date().toISOString(),
            restored_by: currentAdmin.id || null,
          })
          .eq('id', log.id);

        await logAdminAction({
          action: 'RESTORE',
          entityType: log.entity_type,
          entityId: log.entity_id,
          beforeData: log.before_data,
          metadata: { source_log_id: log.id }
        });

        showModal("success", "RESTORE COMPLETE", "Product restored.");
        fetchProducts();
        fetchOrders();
        fetchVouchers();
        fetchAuditLogs();
      } catch (err) {
        console.error("Restore Error:", err.message);
        showModal("error", "RESTORE FAILED", err.message);
      } finally {
        setRestoringLogId(null);
        setActionBusy(false);
      }
    };
  
    const adjustStock = async (id, currentStock, amount) => {
      setActionBusy(true);
      try {
        const hasVariantStocks = (variantMap[String(id)] || []).length > 0;
        if (hasVariantStocks) {
          showModal("error", "VARIANT-MANAGED STOCK", "This product uses variant stocks. Edit stock per variant in the product form.");
          return;
        }
        const newStock = Math.max(0, currentStock + amount);
        const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', id);
        if (!error) {
          const product = products.find((p) => p.id === id);
          await logAdminAction({
            action: 'STOCK_ADJUST',
            entityType: 'PRODUCT',
            entityId: id,
            beforeData: product ? { ...product, stock: currentStock } : null,
            afterData: product ? { ...product, stock: newStock } : { stock: newStock },
            metadata: { amount }
          });
          fetchProducts();
        }
      } finally {
        setActionBusy(false);
      }
    };

    const releaseOrderItemStockAdmin = async (item) => {
      if (!item?.product_id) return;

      const rpcRelease = await supabase.rpc('release_product_stock', {
        p_product_id: Number(item.product_id),
        p_quantity: Number(item.quantity),
        p_size: item.selected_size || null,
        p_color: item.selected_color || null,
      });

      if (!rpcRelease.error) {
        if (rpcRelease.data?.ok === false) {
          throw new Error(rpcRelease.data?.error || 'Stock release failed.');
        }
        return;
      }

      if (!['42883', 'PGRST202'].includes(String(rpcRelease.error.code || ''))) {
        throw rpcRelease.error;
      }

      const { data: prod, error: readError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.product_id)
        .single();
      if (readError) throw readError;
      if (prod) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ stock: Number(prod.stock) + Number(item.quantity) })
          .eq('id', item.product_id);
        if (updateError) throw updateError;
      }
    };

    const cancelOrderWithRestore = async (orderId) => {
      const rpcCancel = await supabase.rpc('cancel_order_and_restore_stock', {
        p_order_id: String(orderId),
      });

      if (!rpcCancel.error) {
        if (rpcCancel.data?.ok === false) {
          throw new Error(rpcCancel.data?.error || 'Cancel failed.');
        }
        return { handledByRpc: true };
      }

      if (!['42883', 'PGRST202'].includes(String(rpcCancel.error.code || ''))) {
        throw rpcCancel.error;
      }

      return { handledByRpc: false };
    };

    const updateOrderStatus = async (id, status) => {
      setActionBusy(true);
      setOrderActionId(id);
      try {
        const orderToUpdate = orders.find(o => o.id === id);
        if (!orderToUpdate) throw new Error('Order not found.');

        if (status === 'CANCELLED' && (orderToUpdate.status === 'SHIPPED' || orderToUpdate.status === 'PENDING' || orderToUpdate.status === 'PROCESSING')) {
          const cancelResult = await cancelOrderWithRestore(id);
          if (cancelResult.handledByRpc) {
            await logAdminAction({
              action: 'STATUS_UPDATE',
              entityType: 'ORDER',
              entityId: id,
              beforeData: orderToUpdate,
              afterData: orderToUpdate ? { ...orderToUpdate, status } : { status },
              metadata: { from: orderToUpdate?.status, to: status, mode: 'atomic_rpc' }
            });
            showModal("success", "ORDER UPDATED", `Status changed to ${status}.`);
            fetchOrders();
            fetchProducts();
            return;
          }

          for (const item of orderToUpdate.order_items || []) {
            await releaseOrderItemStockAdmin(item);
          }
        }

        const { error } = await supabase.from('orders').update({ status }).eq('id', id);
        if (!error) {
          await logAdminAction({
            action: 'STATUS_UPDATE',
            entityType: 'ORDER',
            entityId: id,
            beforeData: orderToUpdate,
            afterData: orderToUpdate ? { ...orderToUpdate, status } : { status },
            metadata: { from: orderToUpdate?.status, to: status }
          });
          showModal("success", "ORDER UPDATED", `Status changed to ${status}.`);
          fetchOrders();
          fetchProducts();
        }
      } finally {
        setOrderActionId(null);
        setActionBusy(false);
      }
    };

    const confirmOrderStatusChange = (order, nextStatus) => {
      const statusConfig = {
        PROCESSING: "START PROCESSING",
        SHIPPED: "INITIALIZE SHIPMENT",
        DELIVERED: "MARK AS DELIVERED",
        CANCELLED: "ABORT DISPATCH",
      };
      const toneMap = {
        PROCESSING: 'info',
        SHIPPED: 'default',
        DELIVERED: 'success',
        CANCELLED: 'danger',
      };
      openConfirm(
        statusConfig[nextStatus] || "UPDATE ORDER STATUS",
        `Order ${order.id.slice(0, 8)} will move from ${order.status} to ${nextStatus}. Double-check before continuing.`,
        async () => {
          await updateOrderStatus(order.id, nextStatus);
        },
        {
          confirmTone: toneMap[nextStatus] || 'default',
          confirmLabel: nextStatus === 'CANCELLED' ? 'CONFIRM CANCEL' : 'CONFIRM UPDATE',
          cancelLabel: 'GO BACK',
        }
      );
    };

    const confirmPrintWaybill = (order) => {
      openConfirm(
        "PRINT MANIFEST",
        `Generate and print manifest for order ${order.id.slice(0, 8)} now?`,
        async () => {
          printWaybill(order);
        },
        {
          confirmTone: 'info',
          confirmLabel: 'PRINT NOW',
          cancelLabel: 'LATER',
        }
      );
    };

    const printWaybill = (order) => {
      const printWindow = window.open('', '_blank', 'width=900,height=700');
      if (!printWindow) {
        showModal("error", "POP-UP BLOCKED", "Enable pop-ups to print waybills.");
        return;
      }

      const subtotal = order.order_items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
      const discountAmount = subtotal - (order.total_amount || 0);

      const itemsHtml = order.order_items?.map(item => `
        <tr>
          <td style="padding: 15px; border-bottom: 1px solid #333;">
            <div style="font-weight: 900; font-style: italic; text-transform: uppercase;">${item.products?.name || 'Item deleted'}</div>
            ${(item.selected_size || item.selected_color) ? `<div style="font-size: 11px; margin-top: 5px; font-weight: bold; color: #555;">
              SPEC: ${[item.selected_size, item.selected_color].filter(Boolean).join(' | ')}
            </div>` : ''}
          </td>
          <td style="padding: 15px; border-bottom: 1px solid #333; text-align: center;">${item.quantity}</td>
          <td style="padding: 15px; border-bottom: 1px solid #333; text-align: right;">₱${Number(item.price).toLocaleString()}</td>
        </tr>
      `).join('');

      printWindow.document.write(`
        <html>
          <head>
            <title>Waybill - ${order.id.slice(0,8)}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;900&display=swap');
              body { font-family: 'Inter', sans-serif; padding: 50px; color: #000; background: #fff; }
              .header { border-bottom: 8px solid #000; padding-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
              .brand { font-size: 45px; font-weight: 900; font-style: italic; letter-spacing: -2px; margin: 0; }
              .badge { background: #000; color: #fff; padding: 5px 15px; font-size: 12px; font-weight: 900; text-transform: uppercase; }
              table { width: 100%; border-collapse: collapse; margin-top: 30px; }
              .total-row { font-size: 24px; font-weight: 900; border-top: 4px solid #000; margin-top: 20px; padding-top: 10px; display: flex; justify-content: space-between; }
            </style>
          </head>
          <body>
            <div class="header">
              <div><h1 class="brand">PEDALSTREET.</h1><p>MANIFEST ID: ${order.id.toUpperCase()}</p></div>
              <div style="text-align: right"><div class="badge"> Delivery</div><p>${new Date(order.created_at).toLocaleString()}</p></div>
            </div>
            <div style="margin: 40px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
              <div><h4 style="margin-bottom: 5px; text-decoration: underline;">RECIPIENT</h4><strong>${order.profiles?.first_name} ${order.profiles?.last_name}</strong><br>${order.address}<br>T: ${order.phone}<br>INS: ${order.delivery_instructions || 'N/A'}</div>
              <div style="text-align: right"><h4 style="margin-bottom: 5px; text-decoration: underline;">PAYMENT METHOD</h4><strong>${order.payment_method}</strong></div>
            </div>
            <table>
              <thead><tr style="background: #f4f4f4;"><th style="padding:15px;text-align:left">UNIT DESCRIPTION</th><th style="padding:15px">QTY</th><th style="padding:15px;text-align:right">PRICE</th></tr></thead>
              <tbody>${itemsHtml}</tbody>
            </table>
            <div style="width: 300px; margin-left: auto; margin-top: 30px;">
              <div style="display:flex; justify-content: space-between; margin-bottom: 10px;"><span>Subtotal:</span><span>₱${subtotal.toLocaleString()}</span></div>
              ${order.promo_applied ? `<div style="display:flex; justify-content: space-between; color: red;"><span>Discount:</span><span>-₱${discountAmount.toLocaleString()}</span></div>` : ''}
              <div class="total-row"><span>TOTAL:</span><span>₱${Number(order.total_amount).toLocaleString()}</span></div>
            </div>
            <div style="margin-top: 100px; border-top: 1px dashed #ccc; padding-top: 20px; text-align: center; font-size: 10px; text-transform: uppercase; letter-spacing: 2px;">*** Thank you for riding with PedalStreet ***</div>
            <script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); }</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    };

    const handleVoucherSubmit = async (e) => {
      e.preventDefault();
      setActionBusy(true);
      try {
        const { data, error } = await supabase.from('vouchers').insert([{ 
          code: vForm.code.toUpperCase(), 
          discount_percent: vForm.discount_percent 
        }]).select('*').single();
        if (!error) {
          await logAdminAction({
            action: 'CREATE',
            entityType: 'VOUCHER',
            entityId: data?.id,
            afterData: data
          });
          showModal("success", "PROMO DEPLOYED", "Voucher is now active.");
          setVForm({ code: '', discount_percent: '' });
          fetchVouchers();
        }
      } finally {
        setActionBusy(false);
      }
    };

    const handleCategorySubmit = async (e) => {
      e.preventDefault();
      setActionBusy(true);
      try {
        const code = categoryForm.code.trim().toUpperCase();
        const label = categoryForm.label.trim();
        if (!code || !label) {
          showModal("error", "INVALID CATEGORY", "Code and label are required.");
          return;
        }

        const { data, error } = await supabase
          .from('product_categories')
          .insert([{ code, label, is_active: true }])
          .select('*')
          .single();

        if (error) {
          showModal("error", "CATEGORY FAILED", error.message || "Unable to add category.");
          return;
        }

        await logAdminAction({
          action: 'CREATE',
          entityType: 'CATEGORY',
          entityId: data?.id,
          afterData: data,
        });

        setCategoryForm({ code: '', label: '' });
        fetchCategories();
        showModal("success", "CATEGORY ADDED", `${code} is now available for products.`);
      } finally {
        setActionBusy(false);
      }
    };

    const archiveCategory = async (category) => {
      openConfirm(
        "ARCHIVE CATEGORY",
        `Archive ${category.code}? Existing products keep their category label.`,
        async () => {
          const { count } = await supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('category', category.code)
            .eq('is_archived', false);

          if ((count || 0) > 0) {
            showModal("error", "CATEGORY IN USE", `Cannot archive. ${count} active product(s) still use ${category.code}.`);
            return;
          }

          const { data, error } = await supabase
            .from('product_categories')
            .update({ is_active: false })
            .eq('id', category.id)
            .select('*')
            .single();

          if (error) {
            showModal("error", "ARCHIVE FAILED", error.message || "Unable to archive category.");
            return;
          }

          await logAdminAction({
            action: 'ARCHIVE',
            entityType: 'CATEGORY',
            entityId: category.id,
            beforeData: category,
            afterData: data,
          });

          fetchCategories();
          showModal("success", "CATEGORY ARCHIVED", `${category.code} is archived.`);
        }
      );
    };

    const restoreCategory = async (category) => {
      setActionBusy(true);
      try {
        const { data, error } = await supabase
          .from('product_categories')
          .update({ is_active: true })
          .eq('id', category.id)
          .select('*')
          .single();

        if (error) {
          showModal("error", "RESTORE FAILED", error.message || "Unable to restore category.");
          return;
        }

        await logAdminAction({
          action: 'UNARCHIVE',
          entityType: 'CATEGORY',
          entityId: category.id,
          beforeData: category,
          afterData: data,
        });

        fetchCategories();
        showModal("success", "CATEGORY RESTORED", `${category.code} is active again.`);
      } finally {
        setActionBusy(false);
      }
    };

    const deleteOrder = async (id) => {
      openConfirm(
        "DELETE ORDER",
        "Scrap this order record? This cannot be undone.",
        async () => {
          setOrderActionId(id);
          const orderSnapshot = orders.find((o) => o.id === id) || null;
          try {
            const { error } = await supabase.from('orders').delete().eq('id', id);
            if (!error) {
              await logAdminAction({
                action: 'DELETE',
                entityType: 'ORDER',
                entityId: id,
                beforeData: orderSnapshot
              });
              fetchOrders();
            }
          } finally {
            setOrderActionId(null);
          }
        }
      );
    };

    const toVariantDrafts = (rows = []) => {
      if (!rows.length) return [{ size: '', color: '', stock: 0 }];
      return rows.map((row) => ({
        size: row.size || '',
        color: row.color || '',
        stock: Number(row.stock || 0),
      }));
    };

    const updateVariantDraft = (index, field, value) => {
      setVariantDrafts((prev) =>
        prev.map((row, idx) =>
          idx === index
            ? { ...row, [field]: field === 'stock' ? Number(value || 0) : value }
            : row
        )
      );
    };

    const addVariantDraft = () => {
      setVariantDrafts((prev) => [...prev, { size: '', color: '', stock: 0 }]);
    };

    const removeVariantDraft = (index) => {
      setVariantDrafts((prev) => {
        const next = prev.filter((_, idx) => idx !== index);
        return next.length > 0 ? next : [{ size: '', color: '', stock: 0 }];
      });
    };

    const copyVariantsFromProduct = async (sourceProductId) => {
      if (!sourceProductId) return;

      const cached = variantMap[String(sourceProductId)];
      if (cached && cached.length > 0) {
        setVariantDrafts(toVariantDrafts(cached));
        showModal("success", "VARIANTS COPIED", "Variant rows copied from selected product.");
        return;
      }

      const { data, error } = await supabase
        .from('product_variant_stocks')
        .select('size, color, stock')
        .eq('product_id', sourceProductId);

      if (error) {
        showModal("error", "COPY FAILED", error.message || "Unable to fetch source variants.");
        return;
      }

      setVariantDrafts(toVariantDrafts(data || []));
      showModal("success", "VARIANTS COPIED", "Variant rows copied from selected product.");
    };

    const normalizeVariantDrafts = (rows = []) => {
      const normalized = rows
        .map((row) => ({
          size: (row.size || '').trim() || null,
          color: (row.color || '').trim() || null,
          stock: Number(row.stock || 0),
        }))
        .filter((row) => row.size || row.color || row.stock > 0);

      normalized.forEach((row, idx) => {
        if (!Number.isFinite(row.stock) || row.stock < 0) {
          throw new Error(`Invalid variant stock at row ${idx + 1}.`);
        }
      });

      const seen = new Set();
      normalized.forEach((row) => {
        const key = `${row.size || ''}__${row.color || ''}`.toLowerCase();
        if (seen.has(key)) {
          throw new Error('Duplicate variant combination detected. Keep size/color pairs unique.');
        }
        seen.add(key);
      });

      return normalized;
    };

    const syncVariantStocksForProduct = async (productId) => {
      const rows = normalizeVariantDrafts(variantDrafts);
      const { error: deleteError } = await supabase
        .from('product_variant_stocks')
        .delete()
        .eq('product_id', productId);

      if (deleteError && deleteError.code !== '42P01') {
        throw deleteError;
      }

      if (rows.length === 0 || deleteError?.code === '42P01') return;

      const payload = rows.map((row) => ({
        product_id: productId,
        size: row.size,
        color: row.color,
        stock: row.stock,
      }));

      const { error: insertError } = await supabase
        .from('product_variant_stocks')
        .insert(payload);

      if (insertError) throw insertError;

      const totalVariantStock = rows.reduce((sum, row) => sum + Number(row.stock || 0), 0);
      const { error: syncStockError } = await supabase
        .from('products')
        .update({ stock: totalVariantStock })
        .eq('id', productId);
      if (syncStockError) throw syncStockError;
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setActionBusy(true);
      const beforeProduct = editingId ? products.find((p) => p.id === editingId) : null;
      const safeCategory = String(form.category || '').trim().toUpperCase();
      const isKnownCategory = categories.some((c) => c.code === safeCategory && c.is_active);
      if (categories.length > 0 && !isKnownCategory) {
        showModal("error", "INVALID CATEGORY", "Select an active category from Category Manager.");
        setActionBusy(false);
        return;
      }
      const payload = {
        ...form,
        category: safeCategory,
        price: Number(form.price),
        stock: Number(form.stock)
      };

      const action = editingId 
        ? supabase.from('products').update(payload).eq('id', editingId).select('*').single()
        : supabase.from('products').insert([payload]).select('*').single();

      const result = await action;
      
      try {
        if (!result.error) {
          const savedProductId = editingId || result.data?.id;
          if (savedProductId) {
            await syncVariantStocksForProduct(savedProductId);
          }
          await logAdminAction({
            action: editingId ? 'UPDATE' : 'CREATE',
            entityType: 'PRODUCT',
            entityId: savedProductId,
            beforeData: beforeProduct,
            afterData: result.data || payload
          });
          showModal("success", editingId ? "UNIT UPDATED" : "PRODUCT DEPLOYED", editingId ? "Product updated successfully." : "Product deployed successfully.");
          setForm({ name: '', price: '', category: '', description: '', image_url: '', stock: 0 });
          setVariantDrafts([{ size: '', color: '', stock: 0 }]);
          setVariantCopySource('');
          setEditingId(null);
          fetchProducts();
        } else {
          console.error("Deploy Error:", result.error.message);
          showModal("error", "DEPLOYMENT FAILED", result.error.message || "Check console for details.");
        }
      } finally {
        setActionBusy(false);
      }
    };

    const deleteProduct = async (product) => {
      openConfirm(
        "ARCHIVE PRODUCT",
        "Archive this product from active inventory?",
        async () => {
          const archivedPatch = {
            is_archived: true,
            archived_at: new Date().toISOString(),
            archived_by: currentAdmin.id || null,
          };
          const { data, error } = await supabase
            .from('products')
            .update(archivedPatch)
            .eq('id', product.id)
            .select('*')
            .single();
          if (!error) {
            await logAdminAction({
              action: 'ARCHIVE',
              entityType: 'PRODUCT',
              entityId: product.id,
              beforeData: product,
              afterData: data || { ...product, ...archivedPatch }
            });
            fetchProducts();
            return;
          }

          const msg = error?.message || 'Unknown delete error';
          console.error("Delete Product Error:", msg);

          if ((error?.code || '').includes('23503')) {
            showModal("error", "DELETE BLOCKED", "May existing order history itong product. For safety, hindi siya puwedeng hard delete.");
          } else {
            showModal("error", "DELETE FAILED", msg);
          }
        }
      );
    };

    const unarchiveProduct = async (product) => {
      setActionBusy(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .update({ is_archived: false, archived_at: null, archived_by: null })
          .eq('id', product.id)
          .select('*')
          .single();

        if (error) {
          showModal("error", "RESTORE FAILED", error.message || 'Unknown error');
          return;
        }

        await logAdminAction({
          action: 'UNARCHIVE',
          entityType: 'PRODUCT',
          entityId: product.id,
          beforeData: product,
          afterData: data || { ...product, is_archived: false, archived_at: null, archived_by: null },
        });

        fetchProducts();
        if (activeTab === 'audit') fetchAuditLogs();
      } finally {
        setActionBusy(false);
      }
    };

    const totalRevenue = orders.filter(o => o.status === 'DELIVERED').reduce((a, b) => a + Number(b.total_amount), 0);
    const lowStockItems = products.filter(p => p.stock <= 5);
    const activeCategories = categories.filter((c) => c.is_active);
    const categoryCodeSet = new Set(categories.map((c) => c.code));
    const userRows = users.filter((u) => {
      const q = userSearch.trim().toLowerCase();
      if (!q) return true;
      const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
      return fullName.includes(q) || (u.username || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
    });
    const salesData = orders.filter(o => o.status === 'DELIVERED').slice(0, 10).map(o => ({
      date: new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      amount: o.total_amount
    })).reverse();
    const filteredOrders = orders
      .filter((o) => filterStatus === 'ALL' || o.status === filterStatus)
      .filter((o) =>
        o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
        `${o.profiles?.first_name} ${o.profiles?.last_name}`.toLowerCase().includes(orderSearch.toLowerCase())
      );
    const dispatchCounts = {
      pending: orders.filter((o) => o.status === 'PENDING').length,
      processing: orders.filter((o) => o.status === 'PROCESSING').length,
      shipped: orders.filter((o) => o.status === 'SHIPPED').length,
      cancelled: orders.filter((o) => o.status === 'CANCELLED').length,
    };
    const orderPageSize = 6;
    const orderTotalPages = Math.max(1, Math.ceil(filteredOrders.length / orderPageSize));
    const safeOrderPage = Math.min(orderPage, orderTotalPages);
    const orderStartIndex = (safeOrderPage - 1) * orderPageSize;
    const orderEndIndex = Math.min(filteredOrders.length, orderStartIndex + orderPageSize);
    const paginatedOrders = filteredOrders.slice(orderStartIndex, orderEndIndex);

    const categoryPageSize = 10;
    const categoryTotalPages = Math.max(1, Math.ceil(categories.length / categoryPageSize));
    const safeCategoryPage = Math.min(categoryPage, categoryTotalPages);
    const categoryStartIndex = (safeCategoryPage - 1) * categoryPageSize;
    const categoryEndIndex = Math.min(categories.length, categoryStartIndex + categoryPageSize);
    const paginatedCategories = categories.slice(categoryStartIndex, categoryEndIndex);

    const userPageSize = 10;
    const userTotalPages = Math.max(1, Math.ceil(userRows.length / userPageSize));
    const safeUserPage = Math.min(userPage, userTotalPages);
    const userStartIndex = (safeUserPage - 1) * userPageSize;
    const userEndIndex = Math.min(userRows.length, userStartIndex + userPageSize);
    const paginatedUsers = userRows.slice(userStartIndex, userEndIndex);

    const voucherPageSize = 10;
    const voucherTotalPages = Math.max(1, Math.ceil(vouchers.length / voucherPageSize));
    const safeVoucherPage = Math.min(voucherPage, voucherTotalPages);
    const voucherStartIndex = (safeVoucherPage - 1) * voucherPageSize;
    const voucherEndIndex = Math.min(vouchers.length, voucherStartIndex + voucherPageSize);
    const paginatedVouchers = vouchers.slice(voucherStartIndex, voucherEndIndex);

    const auditPageSize = 12;
    const auditTotalPages = Math.max(1, Math.ceil(auditLogs.length / auditPageSize));
    const safeAuditPage = Math.min(auditPage, auditTotalPages);
    const auditStartIndex = (safeAuditPage - 1) * auditPageSize;
    const auditEndIndex = Math.min(auditLogs.length, auditStartIndex + auditPageSize);
    const paginatedAuditLogs = auditLogs.slice(auditStartIndex, auditEndIndex);

    const inventoryFiltered = products
      .filter((p) => {
        if (productViewFilter === 'ACTIVE') return !p.is_archived;
        if (productViewFilter === 'ARCHIVED') return !!p.is_archived;
        return true;
      })
      .filter((p) => String(p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || String(p.category || '').toLowerCase().includes(searchTerm.toLowerCase()));

    const inventorySorted = [...inventoryFiltered].sort((a, b) => {
      switch (productSort) {
        case 'OLDEST':
          return Number(a.id) - Number(b.id);
        case 'PRICE_HIGH':
          return Number(b.price) - Number(a.price);
        case 'PRICE_LOW':
          return Number(a.price) - Number(b.price);
        case 'STOCK_LOW':
          return Number(a.stock) - Number(b.stock);
        case 'STOCK_HIGH':
          return Number(b.stock) - Number(a.stock);
        case 'NAME_AZ':
          return String(a.name).localeCompare(String(b.name));
        case 'NAME_ZA':
          return String(b.name).localeCompare(String(a.name));
        case 'NEWEST':
        default:
          return Number(b.id) - Number(a.id);
      }
    });

    const productTotalPages = Math.max(1, Math.ceil(inventorySorted.length / productPageSize));
    const safeProductPage = Math.min(productPage, productTotalPages);
    const productStartIndex = (safeProductPage - 1) * productPageSize;
    const productEndIndex = Math.min(productStartIndex + productPageSize, inventorySorted.length);
    const paginatedProducts = inventorySorted.slice(productStartIndex, productEndIndex);

    useEffect(() => {
      setProductPage(1);
    }, [searchTerm, productViewFilter, productSort, productPageSize]);

    useEffect(() => {
      setOrderPage(1);
    }, [orderSearch, filterStatus]);

    useEffect(() => {
      setUserPage(1);
    }, [userSearch]);

    useEffect(() => {
      if (productPage > productTotalPages) setProductPage(productTotalPages);
    }, [productPage, productTotalPages]);

    useEffect(() => {
      fetchVariantStocks(products);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [products]);

    return (
      <div className={`flex flex-col lg:flex-row min-h-screen ${darkMode ? 'bg-[#050505]' : 'bg-[#f8f9fa]'} ${themeTextMain} transition-colors duration-500`}>
        <ActionProgressBar active={loading || auditLoading || productsLoading || vouchersLoading || uploading || actionBusy || restoringLogId !== null} />
        
        <div className={`hidden lg:flex lg:w-72 ${themeSidebar} border-r p-10 flex-col justify-between sticky top-0 h-screen transition-colors`}>
          <div className="space-y-12">
            <div>
              <h1 className={`text-3xl font-black italic tracking-tighter ${themeTextMain}`}>PEDAL<span className="text-orange-600">STREET.</span></h1>
              <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <p className={`text-[8px] font-black ${themeTextSub} tracking-[0.4em] uppercase`}>PRODUCT AND ORDER MANAGEMENT</p>
              </div>
            </div>

            <nav className="space-y-3">
              {[
                { id: 'dashboard', label: 'Overview', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
                { id: 'inventory', label: 'PRODUCTS', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
                { id: 'orders', label: 'Live Dispatch', icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z' },
                { id: 'categories', label: 'Categories', icon: 'M4 7h16M4 12h16M4 17h10' },
                { id: 'users', label: 'Users', icon: 'M17 20h5V4H2v16h5m10 0v-4a4 4 0 00-8 0v4m8 0H9m8 0a1 1 0 001 1h3a1 1 0 001-1M9 20a1 1 0 01-1 1H5a1 1 0 01-1-1m5 0v-4a4 4 0 018 0v4' },
                { id: 'vouchers', label: 'Promo Voucher', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
                { id: 'audit', label: 'Audit Trail', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }
              ].map((tab) => (
                <button 
                  key={tab.id} 
                  onClick={() => setActiveTab(tab.id)} 
                  className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all group ${activeTab === tab.id ? 'bg-orange-600 text-white shadow-[0_10px_30px_rgba(234,88,12,0.3)]' : `text-gray-500 hover:text-orange-600 ${darkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}`}
                >
                  <svg className={`w-5 h-5 ${activeTab === tab.id ? 'text-white' : 'text-gray-600 group-hover:text-orange-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={tab.icon} />
                  </svg>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          <div className={`pt-10 border-t ${darkMode ? 'border-white/5' : 'border-black/5'}`}>
              <p className={`text-[8px] font-black ${darkMode ? 'text-gray-700' : 'text-gray-400'} uppercase tracking-widest`}>© 2026 PS_GLOBAL_OPS</p>
          </div>
        </div>

        <div className={`lg:hidden fixed bottom-0 left-0 right-0 z-[90] ${darkMode ? 'bg-[#0d0e12]/90' : 'bg-white/90'} backdrop-blur-xl border-t ${darkMode ? 'border-white/5' : 'border-gray-200'} p-4 flex justify-around`}>
          {[
            { id: 'dashboard', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
            { id: 'inventory', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
            { id: 'orders', icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z' },
            { id: 'categories', icon: 'M4 7h16M4 12h16M4 17h10' },
            { id: 'users', icon: 'M17 20h5V4H2v16h5m10 0v-4a4 4 0 00-8 0v4m8 0H9m8 0a1 1 0 001 1h3a1 1 0 001-1M9 20a1 1 0 01-1 1H5a1 1 0 01-1-1m5 0v-4a4 4 0 018 0v4' },
            { id: 'vouchers', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
            { id: 'audit', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`p-4 rounded-xl ${activeTab === tab.id ? 'bg-orange-600 text-white' : 'text-gray-500'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={tab.icon} /></svg>
            </button>
          ))}
        </div>

        <div className="flex-1 p-6 lg:p-16 overflow-y-auto pb-32 lg:pb-16">
          
          {activeTab === 'dashboard' && (
            <div className="space-y-8 lg:space-y-12 animate-in fade-in duration-700">
              <header>
                  <p className="text-orange-600 font-black text-[10px] tracking-[0.5em] uppercase mb-2 italic">Performance Analytics</p>
                  <h2 className="text-4xl lg:text-6xl font-black italic uppercase tracking-tighter">Command <span className={`${darkMode ? 'text-white/20' : 'text-black/10'} font-outline-2`}>Center.</span></h2>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                <div className={`${themeCard} p-8 lg:p-10 rounded-[2.5rem] lg:rounded-[3rem] group hover:border-green-500/30 transition-all`}>
                  <p className={`text-[9px] font-black ${themeTextSub} uppercase mb-4 tracking-widest flex items-center gap-2`}>
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span> Net Revenue
                  </p>
                  <h3 className={`text-4xl lg:text-5xl font-black italic ${themeTextMain} tracking-tighter`}>₱{totalRevenue.toLocaleString()}</h3>
                </div>
                <div className={`${themeCard} p-8 lg:p-10 rounded-[2.5rem] lg:rounded-[3rem] group hover:border-blue-500/30 transition-all`}>
                  <p className={`text-[9px] font-black ${themeTextSub} uppercase mb-4 tracking-widest flex items-center gap-2`}>
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span> Vouchers 
                  </p>
                  <h3 className={`text-4xl lg:text-5xl font-black italic ${themeTextMain} tracking-tighter`}>{vouchers.length} Units</h3>
                </div>
                <div className={`${themeCard} p-8 lg:p-10 rounded-[2.5rem] lg:rounded-[3rem] border transition-all ${lowStockItems.length > 0 ? 'border-red-500/50 animate-pulse' : ''}`}>
                  <p className={`text-[9px] font-black ${themeTextSub} uppercase mb-4 tracking-widest flex items-center gap-2`}>
                      <span className={`w-2 h-2 rounded-full ${lowStockItems.length > 0 ? 'bg-red-500 animate-ping' : 'bg-red-500'}`}></span> Products
                  </p>
                  <h3 className={`text-4xl lg:text-5xl font-black italic tracking-tighter ${lowStockItems.length > 0 ? 'text-red-500' : themeTextMain}`}>{lowStockItems.length}</h3>
                </div>
              </div>

              <div className={`${themeCard} p-6 lg:p-12 rounded-[2.5rem] lg:rounded-[4rem]`}>
                  <div className="h-64 lg:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesData}>
                      <defs>
                          <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                          </linearGradient>
                      </defs>
                      <XAxis dataKey="date" hide />
                      <Tooltip 
                          contentStyle={{background: darkMode ? '#0d0e12' : '#fff', border: darkMode ? '1px solid #333' : '1px solid #ddd', borderRadius: '20px', padding: '10px'}}
                          itemStyle={{color: darkMode ? '#fff' : '#000', fontWeight: '900'}}
                      />
                      <Area type="monotone" dataKey="amount" stroke="#ea580c" fill="url(#colorAmt)" strokeWidth={6} />
                    </AreaChart>
                  </ResponsiveContainer>
                  </div>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-10 duration-700">
              
              <div className="relative">
                <input 
                  className={`w-full ${themeCard} p-6 pl-14 rounded-3xl ${themeTextMain} text-[10px] font-black uppercase tracking-widest outline-none focus:border-orange-600 transition-all`}
                  placeholder="SEARCH PRODUCT (NAME/CATEGORY)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                {['ACTIVE', 'ARCHIVED', 'ALL'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setProductViewFilter(status)}
                    className={`px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-[0.3em] border transition-all flex-shrink-0 ${
                      productViewFilter === status
                        ? 'bg-orange-600 text-white border-orange-600 shadow-lg'
                        : `${themeTextSub} ${darkMode ? 'border-white/5' : 'border-gray-200'} hover:border-orange-600`
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                <select
                  value={productSort}
                  onChange={(e) => setProductSort(e.target.value)}
                  className={`${themeCard} ${themeTextMain} px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none`}
                >
                  <option value="NEWEST">Newest</option>
                  <option value="OLDEST">Oldest</option>
                  <option value="PRICE_HIGH">Price High-Low</option>
                  <option value="PRICE_LOW">Price Low-High</option>
                  <option value="STOCK_LOW">Stock Low-High</option>
                  <option value="STOCK_HIGH">Stock High-Low</option>
                  <option value="NAME_AZ">Name A-Z</option>
                  <option value="NAME_ZA">Name Z-A</option>
                </select>

                <select
                  value={productPageSize}
                  onChange={(e) => setProductPageSize(Number(e.target.value))}
                  className={`${themeCard} ${themeTextMain} px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none`}
                >
                  <option value={12}>12 / page</option>
                  <option value={20}>20 / page</option>
                  <option value={40}>40 / page</option>
                </select>
              </div>

              <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
                  <div className="lg:col-span-4">
                    <form onSubmit={handleSubmit} className={`${themeCard} p-8 lg:p-10 rounded-[2.5rem] lg:rounded-[3rem] lg:sticky lg:top-10`}>
                      <h2 className="text-2xl font-black mb-8 uppercase italic flex items-center gap-3">
                        <span className="w-2 h-8 bg-orange-600 inline-block"></span>
                        {editingId ? "Modify Unit" : "ADD PRODUCT"}
                      </h2>
                      <div className="space-y-5">
                        <input className={`w-full ${themeInput} p-5 rounded-2xl text-xs outline-none focus:border-orange-600 transition-all font-bold`} placeholder="Product Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                        
                        <div className="grid grid-cols-2 gap-4">
                            <input className={`w-full ${themeInput} p-5 rounded-2xl text-xs focus:border-orange-600 outline-none transition-all font-bold`} type="number" placeholder="Price" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
                            <input className={`w-full ${themeInput} p-5 rounded-2xl text-xs focus:border-orange-600 outline-none transition-all font-bold`} type="number" placeholder="Stock" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} required />
                        </div>

                        <select className={`w-full ${themeInput} p-5 rounded-2xl text-xs font-bold outline-none cursor-pointer`} value={form.category} onChange={e => setForm({...form, category: e.target.value})} required>
                          <option value="">Select Category</option>
                          {activeCategories.map((category) => (
                            <option key={category.id} value={category.code}>{category.label}</option>
                          ))}
                          {form.category && !categoryCodeSet.has(form.category) && (
                            <option value={form.category}>{form.category}</option>
                          )}
                        </select>

                        <div className="space-y-2">
                          <label className={`text-[10px] font-black ${themeTextSub} uppercase tracking-widest`}>Product Visual</label>
                          <div className="flex gap-2">
                            <input className={`flex-1 ${themeInput} p-5 rounded-2xl text-xs font-bold outline-none truncate`} placeholder="Select from Storage..." value={form.image_url} readOnly required />
                            <button type="button" onClick={() => setShowPicker(true)} className="bg-orange-600 px-4 lg:px-6 rounded-2xl text-[10px] font-black uppercase hover:bg-black hover:text-white transition-all shadow-lg">Browse</button>
                          </div>
                        </div>

                        <textarea className={`w-full ${themeInput} p-5 rounded-2xl h-32 text-xs font-bold outline-none`} placeholder="DESCRIPTION" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className={`text-[10px] font-black ${themeTextSub} uppercase tracking-widest`}>Variant Stocks (Optional)</label>
                            <button
                              type="button"
                              onClick={addVariantDraft}
                              className="text-[9px] font-black uppercase text-orange-600 hover:text-orange-500 transition-colors"
                            >
                              + Add Row
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <select
                              value={variantCopySource}
                              onChange={(e) => setVariantCopySource(e.target.value)}
                              className={`flex-1 ${themeInput} p-3 rounded-xl text-[10px] font-bold outline-none`}
                            >
                              <option value="">Copy variants from product...</option>
                              {products
                                .filter((p) => p.id !== editingId)
                                .map((p) => (
                                  <option key={`copy-variant-${p.id}`} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => copyVariantsFromProduct(variantCopySource)}
                              disabled={!variantCopySource}
                              className={`px-4 rounded-xl text-[9px] font-black uppercase transition-all ${
                                variantCopySource ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-gray-400 text-white cursor-not-allowed'
                              }`}
                            >
                              Copy
                            </button>
                          </div>
                          <div className="space-y-2">
                            {variantDrafts.map((row, idx) => (
                              <div key={`variant-row-${idx}`} className="grid grid-cols-12 gap-2">
                                <input
                                  className={`col-span-4 ${themeInput} p-3 rounded-xl text-[10px] font-bold outline-none`}
                                  placeholder="SIZE"
                                  value={row.size}
                                  onChange={(e) => updateVariantDraft(idx, 'size', e.target.value)}
                                />
                                <input
                                  className={`col-span-4 ${themeInput} p-3 rounded-xl text-[10px] font-bold outline-none`}
                                  placeholder="COLOR"
                                  value={row.color}
                                  onChange={(e) => updateVariantDraft(idx, 'color', e.target.value)}
                                />
                                <input
                                  type="number"
                                  min={0}
                                  className={`col-span-3 ${themeInput} p-3 rounded-xl text-[10px] font-bold outline-none`}
                                  placeholder="STOCK"
                                  value={row.stock}
                                  onChange={(e) => updateVariantDraft(idx, 'stock', e.target.value)}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeVariantDraft(idx)}
                                  className="col-span-1 rounded-xl bg-red-600/10 text-red-600 text-xs font-black hover:bg-red-600 hover:text-white transition-all"
                                  title="Remove row"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <button className={`w-full ${darkMode ? 'bg-white text-black' : 'bg-black text-white'} p-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] hover:bg-orange-600 transition-all shadow-xl`}>
                            {editingId ? "Update Asset" : "Add Product"}
                        </button>
                        
                        {editingId && <button onClick={() => {setEditingId(null); setForm({ name: '', price: '', category: '', description: '', image_url: '', stock: 0 }); setVariantDrafts([{ size: '', color: '', stock: 0 }]); setVariantCopySource('');}} className="w-full text-[9px] text-gray-600 font-black uppercase tracking-widest mt-4 underline">Abort Mission</button>}
                      </div>
                    </form>
                  </div>

                  <div className={`lg:col-span-8 ${themeCard} rounded-[2.5rem] lg:rounded-[3.5rem] overflow-hidden`}>
                      <div className="overflow-x-auto max-h-[75vh] overflow-y-auto">
                        <table className="w-full text-left min-w-[600px]">
                          <thead className={`${darkMode ? 'bg-white/5' : 'bg-gray-100'} uppercase font-black ${themeTextSub} text-[9px] tracking-widest sticky top-0 z-10`}>
                            <tr><th className="p-6 lg:p-10">Assets</th><th className="p-6 lg:p-10">Inventory Control</th><th className="p-6 lg:p-10 text-right">Actions</th></tr>
                          </thead>
                          <tbody className={`divide-y ${darkMode ? 'divide-white/5' : 'divide-gray-200'}`}>
                            {productsLoading && Array.from({ length: 6 }).map((_, idx) => (
                              <tr key={`product-skeleton-${idx}`} className="animate-pulse">
                                <td className="p-6 lg:p-10">
                                  <div className={`h-16 rounded-2xl ${darkMode ? 'bg-white/5' : 'bg-gray-200'}`} />
                                </td>
                                <td className="p-6 lg:p-10">
                                  <div className={`h-10 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-gray-200'}`} />
                                </td>
                                <td className="p-6 lg:p-10">
                                  <div className={`h-10 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-gray-200'}`} />
                                </td>
                              </tr>
                            ))}
                            {paginatedProducts.map(p => {
                              const hasVariants = (variantMap[String(p.id)] || []).length > 0;
                              return (
                              <tr key={p.id} className={`${darkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50'} transition-colors group ${p.is_archived ? 'opacity-50 grayscale' : ''}`}>
                                <td className="p-6 lg:p-10 flex items-center gap-6">
                                    <div className="relative w-16 h-16 lg:w-20 lg:h-20 overflow-hidden rounded-2xl border border-gray-200 bg-white">
                                        <img src={p.image_url} className="w-full h-full object-contain object-center" alt={p.name} />
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-orange-600 mb-1 tracking-widest uppercase">{p.category}</p>
                                        <p className={`font-black italic uppercase text-base lg:text-lg ${themeTextMain}`}>{p.name}</p>
                                        <p className={`${themeTextSub} font-bold text-xs`}>₱{Number(p.price).toLocaleString()}</p>
                                        {variantMap[String(p.id)]?.length > 0 && (
                                          <div className="mt-2 flex flex-wrap gap-1">
                                            <span className="text-[8px] font-black uppercase px-2 py-1 rounded-full bg-blue-600/10 text-blue-500 border border-blue-500/20">
                                              {variantMap[String(p.id)].length} Variants
                                            </span>
                                            {variantMap[String(p.id)].some((v) => Number(v.stock) <= 2) && (
                                              <span className="text-[8px] font-black uppercase px-2 py-1 rounded-full bg-red-600/10 text-red-500 border border-red-500/20 animate-pulse">
                                                Variant Low
                                              </span>
                                            )}
                                          </div>
                                        )}
                                    </div>
                                </td>
                                <td className="p-6 lg:p-10">
                                  <div className="flex items-center gap-4">
                                    <button disabled={p.is_archived || hasVariants} onClick={() => adjustStock(p.id, p.stock, -1)} className={`w-8 h-8 rounded-lg ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-200 border-gray-300'} border flex items-center justify-center hover:bg-red-600 hover:text-white transition-all font-black ${(p.is_archived || hasVariants) ? 'opacity-30 cursor-not-allowed pointer-events-none' : ''}`}>-</button>
                                    <span className={`min-w-[50px] lg:min-w-[60px] text-center px-3 py-2 rounded-full text-[9px] lg:text-[10px] font-black italic border ${p.stock <= 5 ? 'border-red-500 text-red-500 bg-red-500/10 animate-pulse' : 'border-green-500/50 text-green-500 bg-green-500/10'}`}>
                                        {p.stock} U
                                    </span>
                                    <button disabled={p.is_archived || hasVariants} onClick={() => adjustStock(p.id, p.stock, 1)} className={`w-8 h-8 rounded-lg ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-200 border-gray-300'} border flex items-center justify-center hover:bg-green-600 hover:text-white transition-all font-black ${(p.is_archived || hasVariants) ? 'opacity-30 cursor-not-allowed pointer-events-none' : ''}`}>+</button>
                                  </div>
                                  {hasVariants && (
                                    <p className="text-[8px] font-black uppercase tracking-widest text-blue-500 mt-2">Managed by variants</p>
                                  )}
                                </td>
                                <td className="p-6 lg:p-10 text-right">
                                  {!p.is_archived && (
                                    <button
                                      onClick={() => {
                                        setEditingId(p.id);
                                        setForm(p);
                                        setVariantDrafts(toVariantDrafts(variantMap[String(p.id)] || []));
                                        setVariantCopySource('');
                                      }}
                                      className={`text-[10px] font-black uppercase ${themeTextSub} hover:text-orange-600 transition-colors mr-4 lg:mr-6`}
                                    >
                                      EDIT
                                    </button>
                                  )}
                                  {p.is_archived ? (
                                    <button onClick={() => unarchiveProduct(p)} className="text-[10px] font-black uppercase text-green-600 hover:text-green-500 transition-colors">RESTORE</button>
                                  ) : (
                                    <button onClick={() => deleteProduct(p)} className="text-[10px] font-black uppercase text-red-600/50 hover:text-red-600 transition-colors">REMOVE</button>
                                  )}
                                </td>
                              </tr>
                            )})}
                            {paginatedProducts.length === 0 && (
                              <tr>
                                <td colSpan={3} className={`p-10 text-center ${themeTextSub} text-xs font-black uppercase tracking-widest`}>
                                  No products matched your filters.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-6 lg:px-10 py-5 border-t ${darkMode ? 'border-white/5' : 'border-gray-200'}`}>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${themeTextSub}`}>
                          Showing {inventorySorted.length === 0 ? 0 : productStartIndex + 1}-{productEndIndex} of {inventorySorted.length}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setProductPage((prev) => Math.max(1, prev - 1))}
                            disabled={safeProductPage === 1}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                              safeProductPage === 1 ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-orange-600 text-white hover:bg-orange-700'
                            }`}
                          >
                            Prev
                          </button>
                          <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${themeTextMain} ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                            Page {safeProductPage} / {productTotalPages}
                          </span>
                          <button
                            onClick={() => setProductPage((prev) => Math.min(productTotalPages, prev + 1))}
                            disabled={safeProductPage === productTotalPages}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                              safeProductPage === productTotalPages ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-orange-600 text-white hover:bg-orange-700'
                            }`}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                  </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-10 animate-in slide-in-from-right-10 duration-700">
              <div className="relative">
                <input 
                  className={`w-full ${themeCard} p-6 pl-14 rounded-3xl ${themeTextMain} text-[10px] font-black uppercase tracking-widest outline-none focus:border-orange-600 shadow-2xl`}
                  placeholder="SEARCH ID OR RECIPIENT..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                />
              </div>

              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                {['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => (
                  <button 
                      key={s} 
                      onClick={() => setFilterStatus(s)} 
                      className={`px-8 lg:px-10 py-4 rounded-full text-[9px] font-black uppercase tracking-[0.3em] border transition-all flex-shrink-0 ${filterStatus === s ? 'bg-orange-600 text-white border-orange-600 shadow-lg' : `${themeTextSub} ${darkMode ? 'border-white/5' : 'border-gray-200'} hover:border-orange-600`}`}
                  >
                      {s}
                  </button>
                ))}
              </div>

              <div className={`sticky top-4 z-20 ${themeCard} rounded-3xl p-4 lg:p-6 border`}>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  {[
                    { label: 'Visible', value: filteredOrders.length, tone: 'text-orange-600' },
                    { label: 'Pending', value: dispatchCounts.pending, tone: 'text-orange-500' },
                    { label: 'Processing', value: dispatchCounts.processing, tone: 'text-blue-500' },
                    { label: 'Shipped', value: dispatchCounts.shipped, tone: 'text-cyan-500' },
                    { label: 'Cancelled', value: dispatchCounts.cancelled, tone: 'text-red-500' },
                  ].map((metric) => (
                    <div key={metric.label} className={`${darkMode ? 'bg-black/40 border-white/5' : 'bg-gray-50 border-gray-200'} border rounded-2xl p-4`}>
                      <p className={`text-[8px] font-black uppercase tracking-[0.3em] ${themeTextSub}`}>{metric.label}</p>
                      <p className={`text-2xl lg:text-3xl font-black italic mt-2 ${metric.tone}`}>{metric.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-10">
                {loading && Array.from({ length: 3 }).map((_, idx) => (
                  <div key={`order-skeleton-${idx}`} className={`${themeCard} rounded-[3rem] lg:rounded-[4rem] p-10 animate-pulse`}>
                    <div className={`h-8 w-1/4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-gray-200'} mb-6`} />
                    <div className={`h-20 rounded-2xl ${darkMode ? 'bg-white/5' : 'bg-gray-200'}`} />
                  </div>
                ))}
                {!loading && filteredOrders.length === 0 && (
                  <div className={`${themeCard} rounded-[3rem] lg:rounded-[4rem] p-10 border text-center`}>
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-orange-600 mb-3">No Dispatch Results</p>
                    <p className={`text-xs font-bold ${themeTextSub}`}>
                      {orders.length === 0
                        ? 'No orders yet. Once users checkout, dispatch cards will appear here.'
                        : 'Try a different status filter or search keyword.'}
                    </p>
                  </div>
                )}
                {!loading && paginatedOrders.map((order) => {
                  const isOrderBusy = actionBusy && orderActionId === order.id;
                  return (
                  <div key={order.id} className={`${themeCard} rounded-[3rem] lg:rounded-[4rem] overflow-hidden relative transition-colors`}>
                    <div className={`h-2 w-full ${
                      order.status === 'DELIVERED'
                        ? 'bg-green-500'
                        : order.status === 'CANCELLED'
                        ? 'bg-red-600'
                        : order.status === 'PROCESSING'
                        ? 'bg-blue-500'
                        : 'bg-orange-600'
                    }`}></div>

                    <div className={`p-6 lg:p-10 flex flex-col md:flex-row justify-between md:items-center gap-8 border-b ${darkMode ? 'border-white/5' : 'border-gray-100'}`}>
                      <div>
                          <p className={`text-[8px] font-black ${themeTextSub} uppercase tracking-widest mb-1`}>Logistics Status</p>
                          <span className={`text-[10px] font-black px-6 py-2 rounded-full uppercase italic ${
                            order.status === 'DELIVERED'
                              ? 'bg-green-600/10 text-green-500 border border-green-500/20'
                              : order.status === 'CANCELLED'
                              ? 'bg-red-600/10 text-red-600 border border-red-600/20'
                              : order.status === 'PROCESSING'
                              ? 'bg-blue-600/10 text-blue-500 border border-blue-500/20'
                              : 'bg-orange-600/10 text-orange-600 border border-orange-600/20 animate-pulse'
                          }`}>
                              {order.status}
                          </span>
                          {isOrderBusy && (
                            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-orange-600 mt-2 animate-pulse">Updating...</p>
                          )}
                      </div>
                      
                      <div className="flex flex-wrap gap-3">
                        {order.status !== 'CANCELLED' && (
                          <>
                            <button disabled={isOrderBusy} onClick={() => confirmPrintWaybill(order)} className={`${actionBtnBase} bg-blue-600 text-white hover:bg-blue-700 ${isOrderBusy ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}`}>Print Manifest</button>
                            {order.status === 'PENDING' && (
                              <button disabled={isOrderBusy} onClick={() => confirmOrderStatusChange(order, 'PROCESSING')} className={`${actionBtnBase} ${darkMode ? 'bg-white text-black' : 'bg-black text-white'} hover:bg-blue-600 hover:text-white ${isOrderBusy ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}`}>Start Processing</button>
                            )}
                            {order.status === 'PROCESSING' && (
                              <button disabled={isOrderBusy} onClick={() => confirmOrderStatusChange(order, 'SHIPPED')} className={`${actionBtnBase} ${darkMode ? 'bg-white text-black' : 'bg-black text-white'} hover:bg-orange-600 hover:text-white ${isOrderBusy ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}`}>Initialize Shipment</button>
                            )}
                            {order.status === 'SHIPPED' && (
                              <button disabled={isOrderBusy} onClick={() => confirmOrderStatusChange(order, 'DELIVERED')} className={`${actionBtnBase} bg-green-600 text-white hover:bg-green-700 ${isOrderBusy ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}`}>Mark Finalized</button>
                            )}
                            {(order.status === 'PENDING' || order.status === 'PROCESSING' || order.status === 'SHIPPED') && (
                              <button disabled={isOrderBusy} onClick={() => confirmOrderStatusChange(order, 'CANCELLED')} className={`${actionBtnBase} bg-red-600 text-white hover:bg-red-700 ${isOrderBusy ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}`}>Abort Dispatch</button>
                            )}
                          </>
                        )}
                        <button disabled={isOrderBusy} onClick={() => deleteOrder(order.id)} className={`bg-red-600/10 text-red-600 w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-red-600 hover:text-white transition-all ${isOrderBusy ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}`} aria-label="Delete order">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-8 0l1 12a1 1 0 001 .917h6a1 1 0 001-.917L17 7" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className={`grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x ${darkMode ? 'divide-white/5' : 'divide-gray-100'} ${order.status === 'CANCELLED' ? 'opacity-40 grayscale' : ''}`}>
                      <div className="p-8 lg:p-12">
                          <p className="text-[8px] font-black text-orange-600 uppercase mb-4 tracking-[0.4em] italic flex items-center gap-2">Recipient Info</p>
                          <h3 className={`text-2xl lg:text-3xl font-black italic uppercase leading-none ${themeTextMain}`}>{order.profiles?.first_name} {order.profiles?.last_name}</h3>
                          <p className={`text-[10px] ${themeTextSub} mt-6 font-bold leading-relaxed`}>📍 {order.address}<br/>📞 {order.phone}</p>
                          <div className={`${darkMode ? 'bg-orange-600/10 border-orange-500/30 text-orange-300' : 'bg-orange-50 border-orange-200 text-orange-700'} border rounded-xl px-3 py-2 mt-4`}>
                            <p className="text-[8px] font-black uppercase tracking-[0.25em] mb-1">Delivery Instructions</p>
                            <p className="text-[10px] font-bold leading-relaxed normal-case tracking-normal">
                              {order.delivery_instructions || 'No delivery instructions provided.'}
                            </p>
                          </div>
                      </div>

                      <div className="p-8 lg:p-12">
                          <p className="text-[8px] font-black text-orange-600 uppercase mb-6 tracking-[0.4em] italic">PRODUCT DETAILS</p>
                          <div className="space-y-4">
                          {order.order_items?.map((item, idx) => (
                              <div key={idx} className={`flex gap-4 items-center ${darkMode ? 'bg-black/40 border-white/5' : 'bg-gray-50 border-gray-200'} p-3 rounded-2xl border`}>
                              <div className="w-12 h-12 rounded-xl bg-white border border-black/10 overflow-hidden">
                                <img src={item.products?.image_url} className="w-full h-full object-contain object-center" alt="" />
                              </div>
                              <div>
                                  <p className={`text-[10px] font-black uppercase italic ${themeTextMain} leading-tight`}>{item.products?.name}</p>
                                  <p className="text-[9px] font-bold text-orange-600 uppercase mt-1">Qty: {item.quantity}</p>
                              </div>
                              </div>
                          ))}
                          </div>
                      </div>

                      <div className={`p-8 lg:p-12 ${darkMode ? 'bg-white/[0.01]' : 'bg-gray-50/50'}`}>
                          <p className="text-[8px] font-black text-orange-600 uppercase mb-4 tracking-[0.4em] italic">Settlement</p>
                          <p className={`text-4xl lg:text-6xl font-black italic tracking-tighter ${themeTextMain}`}>₱{Number(order.total_amount).toLocaleString()}</p>
                          <p className={`text-[9px] font-black ${darkMode ? 'text-gray-700' : 'text-gray-400'} uppercase mt-4`}>{order.payment_method}</p>
                      </div>
                    </div>
                  </div>
                )})}
                {!loading && filteredOrders.length > 0 && (
                  <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-2`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${themeTextSub}`}>
                      Showing {filteredOrders.length === 0 ? 0 : orderStartIndex + 1}-{orderEndIndex} of {filteredOrders.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setOrderPage((prev) => Math.max(1, prev - 1))}
                        disabled={safeOrderPage === 1}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                          safeOrderPage === 1 ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-orange-600 text-white hover:bg-orange-700'
                        }`}
                      >
                        Prev
                      </button>
                      <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${themeTextMain} ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                        Page {safeOrderPage} / {orderTotalPages}
                      </span>
                      <button
                        onClick={() => setOrderPage((prev) => Math.min(orderTotalPages, prev + 1))}
                        disabled={safeOrderPage === orderTotalPages}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                          safeOrderPage === orderTotalPages ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-orange-600 text-white hover:bg-orange-700'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="grid lg:grid-cols-12 gap-12 animate-in fade-in duration-700">
              <div className="lg:col-span-4">
                <form onSubmit={handleCategorySubmit} className={`${themeCard} p-8 lg:p-10 rounded-[2.5rem] lg:rounded-[3rem]`}>
                  <h2 className="text-2xl font-black mb-8 uppercase italic">Category Manager</h2>
                  <div className="space-y-6">
                    <input
                      className={`w-full ${themeInput} p-5 rounded-2xl text-xs font-black uppercase outline-none focus:border-orange-600`}
                      placeholder="CODE (ex: APPAREL)"
                      value={categoryForm.code}
                      onChange={(e) => setCategoryForm((prev) => ({ ...prev, code: e.target.value }))}
                      required
                    />
                    <input
                      className={`w-full ${themeInput} p-5 rounded-2xl text-xs font-black uppercase outline-none focus:border-orange-600`}
                      placeholder="DISPLAY LABEL"
                      value={categoryForm.label}
                      onChange={(e) => setCategoryForm((prev) => ({ ...prev, label: e.target.value }))}
                      required
                    />
                    <button className="w-full bg-orange-600 text-white p-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] hover:bg-black transition-all">
                      Add Category
                    </button>
                  </div>
                </form>
              </div>

              <div className={`lg:col-span-8 ${themeCard} rounded-[2.5rem] lg:rounded-[3.5rem] overflow-hidden`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[560px]">
                    <thead className={`${darkMode ? 'bg-white/5' : 'bg-gray-100'} uppercase font-black ${themeTextSub} text-[9px] tracking-widest`}>
                      <tr>
                        <th className="p-6 lg:p-10">Code</th>
                        <th className="p-6 lg:p-10">Label</th>
                        <th className="p-6 lg:p-10">Status</th>
                        <th className="p-6 lg:p-10 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${darkMode ? 'divide-white/5' : 'divide-gray-200'}`}>
                      {categoriesLoading && (
                        <tr>
                          <td colSpan={4} className={`p-10 text-center ${themeTextSub} text-xs font-black uppercase tracking-widest`}>Loading categories...</td>
                        </tr>
                      )}
                      {!categoriesLoading && categories.length === 0 && (
                        <tr>
                          <td colSpan={4} className={`p-10 text-center ${themeTextSub} text-xs font-black uppercase tracking-widest`}>No categories yet.</td>
                        </tr>
                      )}
                      {!categoriesLoading && paginatedCategories.map((category) => (
                        <tr key={category.id} className={`${darkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50'} transition-colors`}>
                          <td className="p-6 lg:p-10 font-black text-orange-600 italic text-lg">{category.code}</td>
                          <td className={`p-6 lg:p-10 font-black text-sm ${themeTextMain}`}>{category.label}</td>
                          <td className="p-6 lg:p-10">
                            <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-wider ${category.is_active ? 'bg-green-600/10 text-green-500 border border-green-500/20' : 'bg-red-600/10 text-red-500 border border-red-500/20'}`}>
                              {category.is_active ? 'Active' : 'Archived'}
                            </span>
                          </td>
                          <td className="p-6 lg:p-10 text-right">
                            {category.is_active ? (
                              <button onClick={() => archiveCategory(category)} className="text-[10px] font-black uppercase text-red-600 hover:text-red-500 transition-colors">Archive</button>
                            ) : (
                              <button onClick={() => restoreCategory(category)} className="text-[10px] font-black uppercase text-green-600 hover:text-green-500 transition-colors">Restore</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!categoriesLoading && categories.length > 0 && (
                  <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-6 lg:px-10 py-5 border-t ${darkMode ? 'border-white/5' : 'border-gray-200'}`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${themeTextSub}`}>
                      Showing {categories.length === 0 ? 0 : categoryStartIndex + 1}-{categoryEndIndex} of {categories.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCategoryPage((prev) => Math.max(1, prev - 1))}
                        disabled={safeCategoryPage === 1}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                          safeCategoryPage === 1 ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-orange-600 text-white hover:bg-orange-700'
                        }`}
                      >
                        Prev
                      </button>
                      <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${themeTextMain} ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                        Page {safeCategoryPage} / {categoryTotalPages}
                      </span>
                      <button
                        onClick={() => setCategoryPage((prev) => Math.min(categoryTotalPages, prev + 1))}
                        disabled={safeCategoryPage === categoryTotalPages}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                          safeCategoryPage === categoryTotalPages ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-orange-600 text-white hover:bg-orange-700'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-8 animate-in fade-in duration-700">
              <div className="relative">
                <input
                  className={`w-full ${themeCard} p-6 pl-14 rounded-3xl ${themeTextMain} text-[10px] font-black uppercase tracking-widest outline-none focus:border-orange-600 transition-all`}
                  placeholder="SEARCH USER (NAME/USERNAME/EMAIL)..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>

              <div className={`${themeCard} rounded-[2.5rem] lg:rounded-[3.5rem] overflow-hidden`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[900px]">
                    <thead className={`${darkMode ? 'bg-white/5' : 'bg-gray-100'} uppercase font-black ${themeTextSub} text-[9px] tracking-widest`}>
                      <tr>
                        <th className="p-6 lg:p-10">Name</th>
                        <th className="p-6 lg:p-10">Username</th>
                        <th className="p-6 lg:p-10">Email</th>
                        <th className="p-6 lg:p-10">Phone</th>
                        <th className="p-6 lg:p-10">Role</th>
                        <th className="p-6 lg:p-10">Joined</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${darkMode ? 'divide-white/5' : 'divide-gray-200'}`}>
                      {usersLoading && (
                        <tr>
                          <td colSpan={6} className={`p-10 text-center ${themeTextSub} text-xs font-black uppercase tracking-widest`}>Loading users...</td>
                        </tr>
                      )}
                      {!usersLoading && userRows.length === 0 && (
                        <tr>
                          <td colSpan={6} className={`p-10 text-center ${themeTextSub} text-xs font-black uppercase tracking-widest`}>No users found.</td>
                        </tr>
                      )}
                      {!usersLoading && paginatedUsers.map((u) => (
                        <tr key={u.id} className={`${darkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50'} transition-colors`}>
                          <td className="p-6 lg:p-10">
                            <p className={`font-black italic uppercase text-sm ${themeTextMain}`}>{`${u.first_name || ''} ${u.last_name || ''}`.trim() || 'N/A'}</p>
                            <p className={`text-[10px] font-bold ${themeTextSub}`}>{u.id}</p>
                          </td>
                          <td className={`p-6 lg:p-10 text-xs font-black uppercase ${themeTextMain}`}>@{u.username || 'no-username'}</td>
                          <td className={`p-6 lg:p-10 text-xs font-bold ${themeTextSub}`}>{u.email || 'N/A'}</td>
                          <td className={`p-6 lg:p-10 text-xs font-bold ${themeTextSub}`}>{u.phone || 'N/A'}</td>
                          <td className="p-6 lg:p-10">
                            <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-wider ${u.is_admin ? 'bg-orange-600/10 text-orange-600 border border-orange-600/20' : 'bg-blue-600/10 text-blue-500 border border-blue-500/20'}`}>
                              {u.is_admin ? 'Admin' : 'Customer'}
                            </span>
                          </td>
                          <td className={`p-6 lg:p-10 text-xs font-bold ${themeTextSub}`}>{u.created_at ? new Date(u.created_at).toLocaleString() : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!usersLoading && userRows.length > 0 && (
                  <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-6 lg:px-10 py-5 border-t ${darkMode ? 'border-white/5' : 'border-gray-200'}`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${themeTextSub}`}>
                      Showing {userRows.length === 0 ? 0 : userStartIndex + 1}-{userEndIndex} of {userRows.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setUserPage((prev) => Math.max(1, prev - 1))}
                        disabled={safeUserPage === 1}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                          safeUserPage === 1 ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-orange-600 text-white hover:bg-orange-700'
                        }`}
                      >
                        Prev
                      </button>
                      <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${themeTextMain} ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                        Page {safeUserPage} / {userTotalPages}
                      </span>
                      <button
                        onClick={() => setUserPage((prev) => Math.min(userTotalPages, prev + 1))}
                        disabled={safeUserPage === userTotalPages}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                          safeUserPage === userTotalPages ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-orange-600 text-white hover:bg-orange-700'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'vouchers' && (
            <div className="grid lg:grid-cols-12 gap-12 animate-in fade-in duration-700">
              <div className="lg:col-span-4">
                <form onSubmit={handleVoucherSubmit} className={`${themeCard} p-8 lg:p-10 rounded-[2.5rem] lg:rounded-[3rem]`}>
                  <h2 className="text-2xl font-black mb-8 uppercase italic">Create Voucher</h2>
                  <div className="space-y-6">
                    <input className={`w-full ${themeInput} p-5 rounded-2xl text-xs font-black uppercase outline-none focus:border-blue-600`} placeholder="PROMO_CODE" value={vForm.code} onChange={e => setVForm({...vForm, code: e.target.value})} required />
                    <input className={`w-full ${themeInput} p-5 rounded-2xl text-xs font-black focus:border-blue-600 outline-none`} type="number" placeholder="Percentage %" value={vForm.discount_percent} onChange={e => setVForm({...vForm, discount_percent: e.target.value})} required />
                    <button className="w-full bg-blue-600 text-white p-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] hover:bg-blue-700 transition-all">Activate Voucher</button>
                  </div>
                </form>
              </div>
              
              <div className={`lg:col-span-8 ${themeCard} rounded-[2.5rem] lg:rounded-[3.5rem] overflow-hidden`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[500px]">
                      <thead className={`${darkMode ? 'bg-white/5' : 'bg-gray-100'} uppercase font-black ${themeTextSub} text-[9px] tracking-widest`}>
                        <tr><th className="p-6 lg:p-10">Promo Unit</th><th className="p-6 lg:p-10">PERCENTAGE</th><th className="p-6 lg:p-10 text-right">Status</th></tr>
                      </thead>
                      <tbody className={`divide-y ${darkMode ? 'divide-white/5' : 'divide-gray-200'}`}>
                        {vouchersLoading && Array.from({ length: 5 }).map((_, idx) => (
                          <tr key={`voucher-skeleton-${idx}`} className="animate-pulse">
                            <td className="p-6 lg:p-10"><div className={`h-8 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-gray-200'}`} /></td>
                            <td className="p-6 lg:p-10"><div className={`h-8 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-gray-200'}`} /></td>
                            <td className="p-6 lg:p-10"><div className={`h-6 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-gray-200'}`} /></td>
                          </tr>
                        ))}
                        {paginatedVouchers.map(v => (
                          <tr key={v.id}>
                            <td className="p-6 lg:p-10 font-black text-blue-500 italic text-2xl">{v.code}</td>
                            <td className={`p-6 lg:p-10 font-black text-xl lg:text-2xl italic ${themeTextMain}`}>{v.discount_percent}% DEDUCTION</td>
                            <td className="p-6 lg:p-10 text-right"><span className="text-green-500 font-black uppercase text-[10px] italic">Active</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!vouchersLoading && vouchers.length > 0 && (
                    <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-6 lg:px-10 py-5 border-t ${darkMode ? 'border-white/5' : 'border-gray-200'}`}>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${themeTextSub}`}>
                        Showing {vouchers.length === 0 ? 0 : voucherStartIndex + 1}-{voucherEndIndex} of {vouchers.length}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setVoucherPage((prev) => Math.max(1, prev - 1))}
                          disabled={safeVoucherPage === 1}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                            safeVoucherPage === 1 ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-orange-600 text-white hover:bg-orange-700'
                          }`}
                        >
                          Prev
                        </button>
                        <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${themeTextMain} ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                          Page {safeVoucherPage} / {voucherTotalPages}
                        </span>
                        <button
                          onClick={() => setVoucherPage((prev) => Math.min(voucherTotalPages, prev + 1))}
                          disabled={safeVoucherPage === voucherTotalPages}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                            safeVoucherPage === voucherTotalPages ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-orange-600 text-white hover:bg-orange-700'
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-8 animate-in fade-in duration-700">
              <div className={`${themeCard} p-8 lg:p-10 rounded-[2.5rem] lg:rounded-[3rem]`}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="text-orange-600 font-black text-[10px] tracking-[0.4em] uppercase mb-2 italic">Admin Accountability</p>
                    <h2 className={`text-3xl lg:text-4xl font-black italic uppercase tracking-tighter ${themeTextMain}`}>Audit Trail</h2>
                  </div>
                  <button onClick={fetchAuditLogs} className={`${darkMode ? 'bg-white text-black' : 'bg-black text-white'} px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all`}>
                    Refresh Logs
                  </button>
                </div>
              </div>

              <div className={`${themeCard} rounded-[2.5rem] lg:rounded-[3rem] overflow-hidden`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[900px]">
                    <thead className={`${darkMode ? 'bg-white/5' : 'bg-gray-100'} uppercase font-black ${themeTextSub} text-[9px] tracking-widest`}>
                      <tr>
                        <th className="p-6 lg:p-8">Time</th>
                        <th className="p-6 lg:p-8">Admin</th>
                        <th className="p-6 lg:p-8">Action</th>
                        <th className="p-6 lg:p-8">Entity</th>
                        <th className="p-6 lg:p-8">Reference</th>
                        <th className="p-6 lg:p-8 text-right">Recovery</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${darkMode ? 'divide-white/5' : 'divide-gray-200'}`}>
                      {auditLoading && (
                        <tr>
                          <td colSpan={6} className={`p-10 text-center ${themeTextSub} text-xs font-black uppercase tracking-widest`}>Loading audit logs...</td>
                        </tr>
                      )}

                      {!auditLoading && auditLogs.length === 0 && (
                        <tr>
                          <td colSpan={6} className={`p-10 text-center ${themeTextSub} text-xs font-black uppercase tracking-widest`}>No audit history found.</td>
                        </tr>
                      )}

                      {!auditLoading && paginatedAuditLogs.map((log) => {
                        const canRestore = ['DELETE', 'ARCHIVE'].includes(log.action) && !log.restored_at && ['PRODUCT', 'ORDER', 'VOUCHER'].includes(log.entity_type);
                        return (
                          <tr key={log.id} className={`${darkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50'} transition-colors`}>
                            <td className="p-6 lg:p-8 text-xs font-bold whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                            <td className="p-6 lg:p-8">
                              <div className="text-xs font-black uppercase">{log.actor_name || 'Unknown Admin'}</div>
                              <div className={`text-[10px] font-bold ${themeTextSub}`}>@{log.metadata?.actor_username || 'no-username'}</div>
                              <div className={`text-[10px] font-bold ${themeTextSub}`}>{log.actor_email || 'N/A'}</div>
                            </td>
                            <td className="p-6 lg:p-8">
                              <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                log.action === 'DELETE' ? 'bg-red-600/10 text-red-500 border border-red-500/20' :
                                log.action === 'RESTORE' ? 'bg-green-600/10 text-green-500 border border-green-500/20' :
                                'bg-orange-600/10 text-orange-600 border border-orange-600/20'
                              }`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="p-6 lg:p-8 text-xs font-black uppercase">{log.entity_type}</td>
                            <td className={`p-6 lg:p-8 text-xs font-bold ${themeTextSub}`}>{log.entity_id || '-'}</td>
                            <td className="p-6 lg:p-8 text-right">
                              {canRestore ? (
                                <button
                                  onClick={() => restoreAuditRecord(log)}
                                  disabled={restoringLogId === log.id}
                                  className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${
                                    restoringLogId === log.id
                                      ? 'bg-gray-400 text-white cursor-not-allowed'
                                      : 'bg-green-600 text-white hover:bg-green-700'
                                  }`}
                                >
                                  {restoringLogId === log.id ? 'Restoring...' : 'Restore'}
                                </button>
                              ) : (
                                <span className={`text-[9px] font-black uppercase ${themeTextSub}`}>
                                  {log.restored_at ? 'Restored' : '-'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {!auditLoading && auditLogs.length > 0 && (
                  <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-6 lg:px-10 py-5 border-t ${darkMode ? 'border-white/5' : 'border-gray-200'}`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${themeTextSub}`}>
                      Showing {auditLogs.length === 0 ? 0 : auditStartIndex + 1}-{auditEndIndex} of {auditLogs.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setAuditPage((prev) => Math.max(1, prev - 1))}
                        disabled={safeAuditPage === 1}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                          safeAuditPage === 1 ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-orange-600 text-white hover:bg-orange-700'
                        }`}
                      >
                        Prev
                      </button>
                      <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${themeTextMain} ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                        Page {safeAuditPage} / {auditTotalPages}
                      </span>
                      <button
                        onClick={() => setAuditPage((prev) => Math.min(auditTotalPages, prev + 1))}
                        disabled={safeAuditPage === auditTotalPages}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                          safeAuditPage === auditTotalPages ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-orange-600 text-white hover:bg-orange-700'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {showPicker && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-6 bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
            <div className={`${darkMode ? 'bg-[#0d0e12] border-white/10' : 'bg-white border-gray-200'} w-full max-w-4xl max-h-[85vh] rounded-[2rem] lg:rounded-[3rem] flex flex-col overflow-hidden shadow-2xl`}>
              <div className={`p-6 lg:p-10 border-b ${darkMode ? 'border-white/5 bg-white/[0.02]' : 'border-gray-100 bg-gray-50'} flex flex-col md:flex-row justify-between items-center gap-6`}>
                <div>
                  <h3 className={`text-2xl font-black italic uppercase tracking-tighter ${themeTextMain}`}>Asset <span className="text-orange-600">Library.</span></h3>
                  <p className={`text-[9px] font-black ${themeTextSub} uppercase tracking-widest mt-1`}>Source: bucket/product-images</p>
                </div>

                <div className="flex items-center gap-4">
                  <label className={`cursor-pointer ${darkMode ? 'bg-white text-black' : 'bg-black text-white'} px-6 lg:px-8 py-3 lg:py-4 rounded-2xl text-[10px] font-black uppercase hover:bg-orange-600 transition-all flex items-center gap-2 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
                    {uploading ? 'UPLOADING...' : 'UPLOAD NEW FILE'}
                    <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
                  </label>

                  <button onClick={() => setShowPicker(false)} className={`bg-white/5 hover:bg-red-600 ${themeTextMain} px-6 py-3 lg:py-4 rounded-2xl text-[10px] font-black uppercase transition-all`}>Close [X]</button>
                </div>
              </div>
              
              <div className="p-6 lg:p-10 overflow-y-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 custom-scrollbar min-h-[400px]">
                {storageImages.length === 0 && !uploading && <p className="col-span-full text-center text-gray-500 py-20 font-black uppercase italic tracking-widest">No assets found in storage...</p>}
                
                {storageImages.map((img) => {
                  const publicUrl = supabase.storage.from('product-images').getPublicUrl(img.name).data.publicUrl;
                  return (
                    <div 
                      key={img.id} 
                      onClick={() => {
                        setForm({...form, image_url: publicUrl});
                        setShowPicker(false);
                      }}
                      className="group cursor-pointer space-y-3"
                    >
                      <div className={`aspect-square rounded-[1.5rem] lg:rounded-[2rem] overflow-hidden border-4 transition-all duration-300 shadow-2xl ${form.image_url === publicUrl ? 'border-orange-600 scale-95' : 'border-transparent group-hover:border-orange-600/50'}`}>
                        <img src={publicUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={img.name} />
                      </div>
                      <p className={`text-[9px] font-black ${themeTextSub} truncate uppercase text-center px-2`}>{img.name}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <Modal
          modal={modal}
          setModal={setModal}
          onConfirm={confirmAction}
          onClose={() => setConfirmAction(null)}
        />
        <Toast toast={toast} setToast={setToast} />
      </div>
    );
  }
