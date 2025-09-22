-- Script para limpar histórico de pedidos
-- Este script remove todos os dados de pedidos mantendo os usuários e produtos

-- Desabilitar verificações de chave estrangeira temporariamente
SET session_replication_role = 'replica';

-- Deletar dados das tabelas de pedidos (ordem importante devido a chaves estrangeiras)
DELETE FROM payments;
DELETE FROM order_items;
DELETE FROM orders;

-- Reabilitar verificações de chave estrangeira
SET session_replication_role = 'origin';

-- Resetar sequências (se existirem)
ALTER SEQUENCE IF EXISTS payments_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS order_items_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS orders_id_seq RESTART WITH 1;

-- Verificar quantidade de registros restantes
SELECT 
    'payments' as tabela, 
    COUNT(*) as total 
FROM payments
UNION ALL
SELECT 
    'order_items' as tabela, 
    COUNT(*) as total 
FROM order_items
UNION ALL
SELECT 
    'orders' as tabela, 
    COUNT(*) as total 
FROM orders;