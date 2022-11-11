
try {
$test="C:\Windows\Temp\default.txt"
$reader = New-Object System.IO.BinaryReader([System.Console]::OpenStandardInput())
$len = $reader.ReadInt32()
$buf = $reader.ReadBytes($len)
$msg = [System.Text.Encoding]::UTF8.GetString($buf)
#$response='{ "response" : "pong" }'
cmd /c netstat -n -o -f | findstr $msg | out-file $test
$getNetStat = cmd /c netstat -n -o -f | findstr $msg
echo $getNetStat.Length | out-file $test
$connections = $getNetStat.Length
For ($i=0; $i -lt $connections; $i++) {
    if($i -eq 0)
    {
        if($connections -gt 1)
        {
            $response = '{ "response" : ['
        }
        else
        {
            $response = '{ "response" : '
        }
        
    }

    if($i -eq $connections -1 )
    {
        if($connections -gt 1)
        {
            $response += ' {"id" : ' + $i + ', "connection" : "' + $getNetStat[$i] + '" }]}'
        }
        else
        {
            $response += ' {"id" : ' + $i + ', "connection" : "' + $getNetStat[$i] + '" }'
        }
        
    }
    else
    {
        $response += ' {"id" : ' + $i + ', "connection" : "' + $getNetStat[$i] + '" },'
    }
    
    #$getNetStat[$i]
}
echo $response | out-file $test
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
    echo "Message: [$($_.Exception.Message)"] | out-file $test
}




#get-date | out-file $test