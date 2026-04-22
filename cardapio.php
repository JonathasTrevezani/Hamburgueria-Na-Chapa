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

// ---------- CONSULTA DO CARDÁPIO ----------
try {
    // REMOVA a condição WHERE disponivel = 1 para trazer TODOS os itens
    $sql = "
        SELECT 
            id,
            nome,
            categoria,
            preco,
            descricao,
            disponivel,
            motivo_indisponibilidade,
            imagem
        FROM cardapio
        ORDER BY categoria, nome
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (isset($result) && is_array($result) && count($result) > 0) {
        // Agrupar por categoria convertida para plural
        $cardapio_agrupado = [];
        
        foreach ($result as $item) {
            // CORREÇÃO: Converter preço para float
            $item['preco'] = (float) $item['preco'];
            
            // Adicionar o campo 'status' baseado no campo 'disponivel' do banco
            // disponivel = 1 -> status = 1 (ativo)
            // disponivel = 0 -> status = 0 (inativo)
            $item['status'] = $item['disponivel']; // 1 ou 0
            
            // Opcional: Adicionar motivo da indisponibilidade (se quiser mostrar no front)
            if ($item['disponivel'] == 0 && !empty($item['motivo_indisponibilidade'])) {
                $item['motivo'] = $item['motivo_indisponibilidade'];
            }
            
            // Converter categoria singular para plural
            $categoria_plural = $item['categoria'] . 's';
            if ($item['categoria'] === 'hamburguer') {
                $categoria_plural = 'hamburgueres';
            }
            
            if (!isset($cardapio_agrupado[$categoria_plural])) {
                $cardapio_agrupado[$categoria_plural] = [];
            }
            
            $cardapio_agrupado[$categoria_plural][] = $item;
        }

        echo json_encode([
            'sucesso' => true,
            'cardapio' => $cardapio_agrupado,
            'total' => count($result)
        ], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode([
            'sucesso' => false,
            'error' => 'Nenhum item encontrado',
            'cardapio' => [],
            'total' => 0
        ], JSON_UNESCAPED_UNICODE);
    }

} catch (Exception $e) {
    echo json_encode([
        'sucesso' => false,
        'error' => $e->getMessage(),
        'cardapio' => [],
        'total' => 0
    ], JSON_UNESCAPED_UNICODE);
}

?>