const username = "ADMIN"
const password = "l2GThBYORfu9qjAoTuh7/2WmJlSoY9n6HATCLeIRwB0="
const credentials = btoa(`${username}:${password}`)

let reenvioMasivo = document.querySelector("#reenvioMasivo")
let reenvio = document.querySelector("#reenvio")
let mostrarReenvio = document.querySelector("#mostrarReenvio")
let mostrarReenvioMasivo = document.querySelector("#mostrarReenvioMasivo")
let btnFile = document.querySelector("#btnFile")
let files = document.querySelector("#files")
let orden = document.querySelector("#orden")
let skuAdd = document.querySelector("#skuAdd")
let sku = document.querySelector("#sku")
let arrSKU = document.querySelector("#arrSKU")
let spiner = document.querySelector("#spiner")
let btnEnviarReenvio = document.querySelector("#btnEnviarReenvio")
let _RE = document.querySelector("#_RE")
let _FE = document.querySelector("#_FE")

let pedidoWMS = []

let contador = 0;

btnEnviarReenvio.onclick = (e) => {
    e.preventDefault()
    let metodTextR = _RE.checked ? 'Reenvio': 'Envio Forzado' ;
    let metodR = _RE.checked ? '_RE': '_EF' ;
    let urlPedido = `https://api.businesscentral.dynamics.com/v2.0/7fbfad4c-f3dc-4bd0-8d8e-250325926ba0/Production/ODataV4/Company('CHEIL')/CabeceraVentas?$filter=Order_no eq '${orden.value}'`
    let urlHisFactura=`https://api.businesscentral.dynamics.com/v2.0/7fbfad4c-f3dc-4bd0-8d8e-250325926ba0/Production/ODataV4/Company('CHEIL')/historico?$filter=Order_No eq '${orden.value}'`
    if(orden.value != ''){
        if(pedidoWMS.length > 0){
            pedido(urlPedido)
            .then(data => {
                if(data.value.length != 0){
                    crearCabecera(orden.value, metodR, data, "pedido")
                    .then(dataCC =>{
                        if(dataCC.error){
                            Toast.fire({
                                icon: 'error',
                                title: `El ${metodTextR} Ya Existe`
                            })
                        }else{
                            pedidoWMS.forEach( async wms => {
                                await crearLinea(orden.value, metodR, wms)
                            })
                            btnCancelar.click()
                            Swal.fire(
                                'Creado!',
                                `El ${metodTextR} ha sido Creado`,
                                'success'
                            )
                        }
                    })
                    .catch(e => console.log(e))
                }else{
                    pedido(urlHisFactura)
                    .then(dataHist => {
                        if(dataHist.value.length != 0){
                            crearCabecera(orden.value, metodR, dataHist, "historial")
                            .then(dataCCH =>{
                                if(dataCCH.error){
                                    Toast.fire({
                                        icon: 'error',
                                        title: `El ${metodTextR} Ya Existe`
                                    })
                                }else{
                                    pedidoWMS.forEach( wms => {
                                        crearLinea(orden.value, metodR, wms)
                                    })
                                    btnCancelar.click()
                                    Swal.fire(
                                        'Creado!',
                                        `El ${metodTextR} ha sido Creado`,
                                        'success'
                                    )
                                }
                            })
                            .catch(e => console.log(e))
                        }else {
                            Toast.fire({
                                icon: 'error',
                                title: `la Orden no existe`
                            })
                        }
                    })
                }
            })
        }else{
            Toast.fire({
                icon: 'error',
                title: `El ${metodTextR} neceita SKUs`
            })
        }
    }else{
        Toast.fire({
            icon: 'error',
            title: `Es Requerido un número de Orden`
        })
    }

}

const buscarListaProductos = async (SKU, precio, cantidad) => {

    let url = `https://api.businesscentral.dynamics.com/v2.0/7fbfad4c-f3dc-4bd0-8d8e-250325926ba0/Production/ODataV4/Company('CHEIL')/ListaProductos?$filter=SKU eq '${SKU}'`

    let resp = await fetch(url,{
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${credentials}`  
        },
    })
    let data = await resp.json()

    contador = pedidoWMS.length + 1; 

    var objWMS = {
        id: contador,
        ean: data.value[0].No,
        Description: data.value[0].Search_Description,
        SKU: data.value[0].SKU,
        precio: precio,
        cantidad: cantidad
    };

    pedidoWMS.push(objWMS)
}

const mostraSku = () => {
    arrSKU.innerHTML = ``
    if(pedidoWMS.length >= 0){
        pedidoWMS.forEach( wms => {
            arrSKU.innerHTML += `
                <li class="list-group-item">
                    <div class="card borderLeftProceso">
                        <div class="card-body">
                            <div class="float-end text-danger"><i class="bi bi-trash" onclick="eliminarSKU(${wms.id})"></i></div>
                            <b>Desc.:</b> ${wms.Description} <b>SKU:</b> ${wms.SKU} <br> <b>Ean:</b> ${wms.ean} <br> 
                            <b>precio: $ </b> ${wms.precio} <b>cantidad: </b> ${wms.cantidad}
                        </div>
                    </div>
                </li>
            `;
        })
    }
}

const eliminarSKU = (id) => {
    pedidoWMS = pedidoWMS.filter(wms => wms.id != id)

    mostraSku()
}

const crearCabecera = async (orden, metodR, pedido, tipo) => {
    const urlCabecera = "https://api.businesscentral.dynamics.com/v2.0/7fbfad4c-f3dc-4bd0-8d8e-250325926ba0/Production/ODataV4/Company('CHEIL')/CabeceraVentas"
    let respuesta = null;
    let data = null;
    if(tipo === "pedido"){
        respuesta = await fetch(urlCabecera,{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`  
            },
            body: JSON.stringify({
                Document_Type: "Order",
                Order_no: `${orden.trim()}${metodR}`,
                Sell_to_Customer_No: "CL-000003",
                obNumber: `${orden.trim()}${metodR}`,
                Person_who_receiber_products: `${pedido.value[0].Person_who_receiber_products}`,
                Country_code: `${pedido.value[0].Country_code}`,
                Post_code: `${pedido.value[0].Post_code}`,
                Province_address: `${pedido.value[0].Province_address}`,
                City_address: `${pedido.value[0].City_address}`,
                District_address: `${pedido.value[0].District_address}`,
                Name_of_the_main_street: `${pedido.value[0].Name_of_the_main_street}`,
                Number_address: `${pedido.value[0].Number_address}`,
                Internal_number_address: `${pedido.value[0].Internal_number_address}`,
                Detail_address: `${pedido.value[0].Detail_address}`,
                Telephone_number: `${pedido.value[0].Telephone_number}`,
                Mobile_number: `${pedido.value[0].Mobile_number}`,
                Carrier_assigned: "",
                Tracking_number: "",
                Pathfile: "",
                Order_withinsurance: `${pedido.value[0].Order_withinsurance}`,
                Description_Order_Insurance: "valid",
                Delivery_method_code: `${pedido.value[0].Delivery_method_code}`,
                Ship_to_Email: `${pedido.value[0].Ship_to_Email}`,
                Delivery_Message: "",
                Status_In_SysEnv: "",
                VTEX_Store: "",
                Status_in_VTEX: "",
                Update_date_SysEnv: "0001-01-01T00:00:00Z",
                Delivery_Date_SysEnv: "0001-01-01T00:00:00Z"
            })
        })
        data = await respuesta.json()
        
    }else if(tipo === "historial"){
        respuesta = await fetch(urlCabecera,{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`  
            },
            body: JSON.stringify({Document_Type: "Order",
                Order_no: `${orden.trim()}${metodR}`,
                Sell_to_Customer_No: "CL-000003",
                obNumber: `${orden.trim()}${metodR}`,
                Person_who_receiber_products: `${pedido.value[0].Ship_to_Name}`,
                Country_code: `${pedido.value[0].Ship_to_Country_Region_Code}`,
                Post_code: `${pedido.value[0].Ship_to_Post_Code}`,
                Province_address: '',
                City_address: `${pedido.value[0].Ship_to_County}`,
                District_address: `${pedido.value[0].Ship_to_County}`,
                Name_of_the_main_street: `${pedido.value[0].Ship_to_Address}`,
                //Number_address: `${pedido.value[0].Number_address}`,
                //Internal_number_address: `${pedido.value[0].Internal_number_address}`,
                //Detail_address: `${pedido.value[0].Detail_address}`,
                //Telephone_number: `${pedido.value[0].Detail_address}`,
                //Mobile_number: `${pedido.value[0].Mobile_number}`,
                Carrier_assigned: "",
                Tracking_number: "",
                Pathfile: "",
                //Order_withinsurance: `${pedido.value[0].Order_withinsurance}`,
                Description_Order_Insurance: "valid",
                //Delivery_method_code: `${pedido.value[0].Delivery_method_code}`,
                //Ship_to_Email: `${pedido.value[0].Ship_to_Email}`,
                Delivery_Message: "",
                Status_In_SysEnv: "",
                VTEX_Store: "",
                Status_in_VTEX: "",
                Update_date_SysEnv: "0001-01-01T00:00:00Z",
                Delivery_Date_SysEnv: "0001-01-01T00:00:00Z"
            })
        })
        data = await respuesta.json()
    }
   
    return data
}

const crearLinea = async (orden, metodR, wms) => {
    let url = "https://api.businesscentral.dynamics.com/v2.0/7fbfad4c-f3dc-4bd0-8d8e-250325926ba0/Production/ODataV4/Company('CHEIL')/LineasVenta"
    let resp = await fetch(url,{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${credentials}`  
        },
        body: JSON.stringify({
            Document_Type: "Order",
            Order_no: `${orden.trim()}${metodR}`,
            Line_No: `${wms.id}0000`,
            Type: 'Artículo',
            Eancode: `${wms.ean}`,
            Sku_price: parseInt(wms.precio, 10),
            Quantity: parseInt(wms.cantidad, 10),
            Unit_of_Measure: "PZA"
        })
    })
    
    let data = await resp.json()
    return data
}

const pedido = async (wmsURL) => {
    let resp = await fetch(wmsURL,{
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${credentials}`  
        },
    })
    let data = await resp.json()
    return data;
    
}

orden.onchange = (e) => {
    e.preventDefault()
    let urlPedido = `https://api.businesscentral.dynamics.com/v2.0/7fbfad4c-f3dc-4bd0-8d8e-250325926ba0/Production/ODataV4/Company('CHEIL')/CabeceraVentas?$filter=Order_no eq '${orden.value}'`
    pedido(urlPedido)
    .then(resp => {
        if(resp.value.length != 0){
            console.log("las orden si existe");
        }else{
            let urlHisFactura=`https://api.businesscentral.dynamics.com/v2.0/7fbfad4c-f3dc-4bd0-8d8e-250325926ba0/Production/ODataV4/Company('CHEIL')/historico?$filter=Order_No eq '${orden.value}'`
            pedido(urlHisFactura)
            .then(resp => {
                if(resp.value.length != 0){
                    console.log("entre");
                }else{
                    Toast.fire({
                        icon: 'error',
                        title: 'EL número de orden no Existe'
                    })
                }
            })
        }
    })
    
}

skuAdd.onclick = (e) => {
    e.preventDefault()
    let arrSku = sku.value.split('|')
    if(arrSku.length === 3){
        spiner.style.display = 'block'
        buscarListaProductos(arrSku[0].trim(), arrSku[1].trim(), arrSku[2].trim())
        .finally(() => {
            spiner.style.display = 'none'
            sku.value = ''
            mostraSku()
        })
    }else{
        Toast.fire({
            icon: 'error',
            title: 'tienes un error en el campo SKU'
        })
    }

}

reenvio.onclick = (e) => {
    e.preventDefault()
    mostrarReenvio.classList.remove('d-none')
    mostrarReenvioMasivo.classList.add('d-none')
}

reenvioMasivo.onclick = (e) => {
    e.preventDefault()
    mostrarReenvioMasivo.classList.remove('d-none')
    mostrarReenvio.classList.add('d-none')
}

btnFile.onclick = (e) => {
    e.preventDefault()
    file.click()
}

btnCancelar.onclick = (e) => {
    e.preventDefault()
    orden.value = ''
    sku.value = ''
    pedidoWMS = []
    contador = 0
    mostraSku()

}

const Toast = Swal.mixin({
    toast: true,
    position: 'top-start',
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
});
