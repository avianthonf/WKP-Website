update public.site_config
set value = '{pizzas} pizzas, {addons} addons, {desserts} desserts',
    updated_at = now()
where key = 'menu_counts_template';

delete from public.site_config
where key = 'menu_filter_extras_label';

delete from public.site_config
where key in ('menu_card_extra_copy', 'menu_card_extra_kind_label');
