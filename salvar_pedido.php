<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');

// ---------- CONEXÃO COM O BANCO (RAILWAY) ----------
$host = 'junction.proxy.rlwy.net';
$port = '34797';
$db   = 'railway';
$user = 'root';
$pass = 'cTuCKmxxmdMVHbodEuRTCiiRSlqTlknB';

try {
    // Conexão PDO com porta
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(["error" => "Erro ao conectar: " . $e->getMessage()]);
    exit;
}

// ---------- RECEBER DADOS DO PEDIDO ----------
$dados = json_decode(file_get_contents('php://input'), true);

if (!$dados) {
    echo json_encode(["sucesso" => false, "error" => "Dados do pedido não recebidos"]);
    exit;
}

try {
    // Iniciar transação
    $pdo->beginTransaction();
    
    // 1. GERAR NÚMERO DO PEDIDO
    $numero_pedido = 'PED' . date('YmdHis') . rand(100, 999);
    
    // 2. INSERIR PEDIDO PRINCIPAL
    $sql_pedido = "
        INSERT INTO pedidos (
            numero_pedido, tipo, nome_cliente, telefone_cliente,
            funcionario_id, cep, rua, numero_endereco, complemento,
            bairro, cidade, estado, observacao, data_pedido,
            horario_pedido, total, status, forma_pagamento, troco_para
        ) VALUES (
            :numero_pedido, :tipo, :nome_cliente, :telefone_cliente,
            :funcionario_id, :cep, :rua, :numero, :complemento,
            :bairro, :cidade, :estado, :observacoes, CURDATE(),
            CURTIME(), :total, 'aberto', :forma_pagamento, :troco_para
        )
    ";
    
    $stmt_pedido = $pdo->prepare($sql_pedido);
    $stmt_pedido->execute([
        ':numero_pedido' => $numero_pedido,
        ':tipo' => $dados['tipo_entrega'] == 'entrega' ? 'Delivery' : ($dados['tipo_entrega'] == 'retirada' ? 'Para-viagem' : 'Local'),
        ':nome_cliente' => $dados['cliente']['nome'] ?? 'Cliente',
        ':telefone_cliente' => $dados['cliente']['telefone'] ?? '',
        ':funcionario_id' => 1, // ID do funcionário padrão (admin)
        ':cep' => $dados['endereco']['cep'] ?? '',
        ':rua' => $dados['endereco']['logradouro'] ?? '',
        ':numero' => $dados['endereco']['numero'] ?? '',
        ':complemento' => $dados['endereco']['complemento'] ?? '',
        ':bairro' => $dados['endereco']['bairro'] ?? '',
        ':cidade' => $dados['endereco']['cidade'] ?? '',
        ':estado' => $dados['endereco']['estado'] ?? '',
        ':observacoes' => $dados['observacoes'] ?? '',
        ':total' => $dados['total'],
        ':forma_pagamento' => $dados['forma_pagamento'] ?? 'pix',
        ':troco_para' => $dados['troco_para'] ?? 0
    ]);
    
    $pedido_id = $pdo->lastInsertId();
    
    // 3. INSERIR ITENS DO PEDIDO
    foreach ($dados['itens'] as $item) {
        // Encontrar ID do cardápio pelo nome (se existir)
        $cardapio_id = null;
        if (isset($item['nome_base'])) {
            $sql_cardapio = "SELECT id FROM cardapio WHERE nome = :nome LIMIT 1";
            $stmt_cardapio = $pdo->prepare($sql_cardapio);
            $stmt_cardapio->execute([':nome' => $item['nome_base']]);
            $cardapio = $stmt_cardapio->fetch(PDO::FETCH_ASSOC);
            $cardapio_id = $cardapio['id'] ?? null;
        }
        
        $sql_item = "
            INSERT INTO pedidos_itens (
                pedido_id, cardapio_id, item_nome, preco_unitario,
                quantidade, subtotal, observacoes
            ) VALUES (
                :pedido_id, :cardapio_id, :item_nome, :preco_unitario,
                1, :subtotal, :observacoes
            )
        ";
        
        $stmt_item = $pdo->prepare($sql_item);
        $stmt_item->execute([
            ':pedido_id' => $pedido_id,
            ':cardapio_id' => $cardapio_id,
            ':item_nome' => $item['nome_completo'],
            ':preco_unitario' => $item['preco'],
            ':subtotal' => $item['preco'],
            ':observacoes' => $item['observacoes'] ?? ''
        ]);
    }
    
    // 4. REGISTRAR NO FINANCEIRO
    $sql_financeiro = "
        INSERT INTO financeiro (
            pedido_id, tipo, categoria, descricao, valor,
            data, horario, funcionario_id, forma_pagamento
        ) VALUES (
            :pedido_id, 'entrada', 'venda', :descricao, :valor,
            CURDATE(), CURTIME(), 1, :forma_pagamento
        )
    ";
    
    $stmt_fin = $pdo->prepare($sql_financeiro);
    $stmt_fin->execute([
        ':pedido_id' => $pedido_id,
        ':descricao' => 'Pedido #' . $numero_pedido,
        ':valor' => $dados['total'],
        ':forma_pagamento' => $dados['forma_pagamento'] ?? 'pix'
    ]);
    
    // Confirmar transação
    $pdo->commit();
    
    echo json_encode([
        'sucesso' => true,
        'mensagem' => 'Pedido salvo com sucesso!',
        'numero_pedido' => $numero_pedido,
        'pedido_id' => $pedido_id
    ]);
    
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode([
        'sucesso' => false,
        'error' => 'Erro ao salvar pedido: ' . $e->getMessage()
    ]);
}
?>