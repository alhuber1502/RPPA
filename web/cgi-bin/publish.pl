#!/usr/bin/perl -w

use strict;
use diagnostics;
use CGI;
use POSIX 'strftime';
use Fcntl qw(:flock);
my $cgi = CGI->new;

my $date = strftime '%Y-%m-%d', localtime;
my $file = "../data/contributions/contexts-".$date.".txt";

sub send_mail {
    my ($from, $email, $type) = @_;

    open(SENDMAIL, "|/usr/sbin/sendmail -t ") || return 0;
    print SENDMAIL <<"MAIL_END";
From: $from <$email>
To: alhuber1502\@gmail.com
Subject: $type

Dear Administrator,

A PRISMS publication request has been received.

This e-mail has been sent via the PRISMS Website.

MAIL_END
    close(SENDMAIL);

    return 1;
}

print CGI::header();
open( my $fd, ">>".$file );
flock $fd, LOCK_EX|LOCK_NB or die "Unable to lock file $!";
print $fd $cgi->param('pub')."\n\n";
close( $fd );
#&send_mail( $cgi->param('name'), $cgi->param('email'), "PRISMS publication request");
