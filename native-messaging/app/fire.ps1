
try {
$test="C:\Windows\Temp\default.txt"
$err="C:\Windows\Temp\err.txt"
$reader = New-Object System.IO.BinaryReader([System.Console]::OpenStandardInput())
$len = $reader.ReadInt32()
$buf = $reader.ReadBytes($len)
$msg = [System.Text.Encoding]::UTF8.GetString($buf)
#$response='{ "response" : "pong" }'
#echo $msg | out-file $test
cmd /c netstat -n -o -f | findstr $msg | out-file $test
$getNetStat = @(cmd /c netstat -n -o -f | findstr $msg)
#echo $getNetStat.Length | out-file $test
$connections = $getNetStat.Length
#echo $connections | out-file $test
For ($i=0; $i -lt $connections; $i++) {
    if($i -eq 0)
    {
        $response = '{ "response" : ['
    }

    if($i -eq $connections -1 )
    {
        $response += ' {"id" : ' + 0 + ', "connection" : "' + $getNetStat[$i] + '" }]}'   
    }
    else
    {
        $response += ' {"id" : ' + 0 + ', "connection" : "' + $getNetStat[$i] + '" },'
    }
    
    #$getNetStat[$i]
}
if ( $connections -eq 0 )
{
    $response = '{ "response" : [{ "id" : 0, "connection" : "" }]}'
}
#echo $response | out-file $test
#$response='{ "response" : "' + $getNetStat + '" }'
$len = $response.Length
$enc        = [System.Text.Encoding]::UTF8
$byte_array = $enc.GetBytes($response)
$byte_len = $byte_array.Length
#echo $bytes_len[0] | out-file $test
$Writer = New-Object System.IO.BinaryWriter([System.Console]::OpenStandardOutput());
$Writer.Write([int32]$byte_len)
$Writer.Write($byte_array)
$Writer.Flush()
$Writer.Close()
}
catch
{
    echo "Message: [$($_.Exception.Message)"] | out-file $err
}




#get-date | out-file $test