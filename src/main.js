/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
    // @TODO: Расчет выручки от операции
    const discountRate = 1 - purchase.discount / 100;
    return purchase.sale_price * purchase.quantity * discountRate;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    if (index === 0)
        return seller.profit * 0.15;
    if (index === 1 || index === 2)
        return seller.profit * 0.10;
    if (index === total - 1)
        return 0;
    return seller.profit * 0.05;
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных

    // @TODO: Проверка наличия опций

    // @TODO: Подготовка промежуточных данных для сбора статистики

    // @TODO: Индексация продавцов и товаров для быстрого доступа

    // @TODO: Расчет выручки и прибыли для каждого продавца

    // @TODO: Сортировка продавцов по прибыли

    // @TODO: Назначение премий на основе ранжирования

    // @TODO: Подготовка итоговой коллекции с нужными полями
    if (
        !data ||
        !data.customers ||
        !data.products ||
        !data.purchase_records ||
        !Array.isArray(data.customers) ||
        !Array.isArray(data.products) ||
        !Array.isArray(data.purchase_records)
    ) {
        throw new Error("Неккоректные входные данные");
    }

    if (
        data.customers.length === 0 ||
        data.products.length === 0 ||
        data.purchase_records.length === 0
    ) {
        throw new Error("Некорректные входные данные: пустые массивы");
    }

    const { calculateRevenue, calculateBonus } = options || {};
    if (
        typeof calculateRevenue !== "function" ||
        typeof calculateBonus !== "function"
    ) {
        throw new Error("Функции неккоректны");
    }

    const productIndex = Object.fromEntries(data.products.map(p => [p.sku, p]));
    const sellerIndex = Object.fromEntries(data.sellers.map(c => [c.id, c]));

    const sellerStats = {};

    data.purchase_records.forEach(record => {
        const sellerId = record.seller_id;
        // const normalizedId = sellerId.replace("seller_", "customer_");
        // const sellerInfo = sellerIndex[normalizedId];
        const sellerInfo = sellerIndex[sellerId];
        if (!sellerStats[sellerId]) {
            sellerStats[sellerId] = {
                seller_id: sellerId,
                name: sellerInfo
                    ? `${sellerInfo.first_name} ${sellerInfo.last_name}`
                    : sellerId,
                revenue: 0,
                profit: 0,
                sales_count: 0,
                products_sold: {}
            };
        }

        const seller = sellerStats[sellerId];
        seller.sales_count += 1;
        seller.revenue += record.total_amount;

        record.items.forEach(item => {
            const product = productIndex[item.sku];
            if (!product) return;

            const revenue = calculateRevenue(item, product);
            const cost = product.purchase_price * item.quantity;
            const profit = revenue - cost;
            seller.profit += profit;

            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;
        });
    });

    const sellersArray = Object.values(sellerStats).sort((a, b) => b.profit - a.profit);

    sellersArray.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, sellersArray.length, seller);
        seller.top_products = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({ sku, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);
    });

    return sellersArray.map(seller => ({
        seller_id: seller.seller_id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: +seller.bonus.toFixed(2)
    }));
}